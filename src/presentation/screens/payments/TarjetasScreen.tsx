import { Button, Input, Layout, Text } from '@ui-kitten/components';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState, Fragment } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  deleteCard,
  getCards,
  type OneClickCard,
  setDefaultCard,
  updateCardName,
} from '../../../modules/session/oneclick';
import { EmptyStateLayout } from '../../../shared/components/layout/EmptyStateLayout';
import { ButtonPrimary } from '../../../shared/components/ui/button';
import { ConfirmPopup } from '../../../shared/components/ui/popup/ConfirmPopup';
import {
  CONTENT_HORIZONTAL_PADDING,
  globalStyles,
} from '../../../shared/theme/theme';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useInfoDialog } from '../../../shared/hooks/useInfoDialog';
import { runOneClickInscriptionFlow } from '../../../shared/utils/oneclickInscription';

export const TarjetasScreen = () => {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<OneClickCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OneClickCard | null>(null);
  const [editTarget, setEditTarget] = useState<OneClickCard | null>(null);
  const [editName, setEditName] = useState('');
  const { showInfo, InfoDialog } = useInfoDialog();

  const refreshCards = useCallback(async () => {
    try {
      const res = await getCards();
      setCards(res.cards ?? []);
    } catch {
      setCards([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const timeoutId = setTimeout(() => {
        if (!isMounted) return;
        void (async () => {
          await refreshCards();
          if (isMounted) setLoading(false);
        })();
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 100);
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }, [refreshCards]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCards();
    setRefreshing(false);
  }, [refreshCards]);

  /**
   * #2.6: la inscripción se hace por `WebBrowser.openAuthSessionAsync` y
   * el resultado vuelve por promesa, así que ya no necesitamos listeners
   * `Linking` para refrescar. El refresh se dispara aquí mismo.
   */
  const handleStartInscription = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const outcome = await runOneClickInscriptionFlow();
      switch (outcome.kind) {
        case 'success':
          await refreshCards();
          return;
        case 'failed': {
          const { code } = outcome;
          showInfo(
            'No se pudo inscribir la tarjeta',
            code
              ? `La inscripción fue rechazada (código ${code}). Verifica los datos e inténtalo nuevamente. Si el problema persiste, prueba con otra tarjeta o contacta a tu banco.`
              : 'La inscripción fue rechazada. Intenta de nuevo. Si el problema persiste, prueba con otra tarjeta o contacta a tu banco.',
          );
          await refreshCards();
          return;
        }
        case 'cancelled':
          // El usuario cerró el navegador. No mostramos alerta intrusiva.
          return;
        case 'unknown':
        default:
          showInfo(
            'Error',
            'No se pudo confirmar el resultado de la inscripción. Verifica si tu tarjeta quedó registrada y, si no, inténtalo nuevamente.',
          );
          await refreshCards();
          return;
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      showInfo(
        'Error',
        message ?? 'No se pudo iniciar la inscripción. Intenta de nuevo.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openEdit = (card: OneClickCard) => {
    setEditTarget(card);
    setEditName(card.displayName ?? '');
  };

  const prettyCardMeta = (card: OneClickCard): string => {
    const last4 = card.cardLast4 ? `****${card.cardLast4}` : 'Tarjeta';
    const type = card.cardType ? `(${card.cardType})` : '';
    return `${last4} ${type}`.trim();
  };

  if (loading) {
    return (
      <Fragment>
        <Layout style={[globalStyles.container, styles.centered]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando...
          </Text>
        </Layout>
        {InfoDialog}
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Layout style={globalStyles.container}>
        <ConfirmPopup
          visible={deleteTarget != null}
          onRequestClose={() => setDeleteTarget(null)}
          title="Eliminar tarjeta"
          labelConfirm="Eliminar"
          confirmDestructive
          loading={isProcessing}
          onConfirm={async () => {
            if (!deleteTarget) return;
            setIsProcessing(true);
            try {
              await deleteCard(deleteTarget.id);
              setDeleteTarget(null);
              await refreshCards();
              showInfo('Listo', 'La tarjeta se eliminó correctamente.');
            } catch (err: unknown) {
              const message =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { message?: string } } })
                      .response?.data?.message
                  : null;
              showInfo(
                'Error',
                message ?? 'No se pudo eliminar la tarjeta. Intenta de nuevo.',
              );
            } finally {
              setIsProcessing(false);
            }
          }}
        >
          <Text appearance="hint">
            ¿Seguro que deseas eliminar esta tarjeta? Tendrás que volver a
            inscribirla para pagar con One Click.
          </Text>
        </ConfirmPopup>

        <ConfirmPopup
          visible={editTarget != null}
          onRequestClose={() => setEditTarget(null)}
          title="Editar nombre"
          labelConfirm="Guardar"
          loading={isProcessing}
          onConfirm={async () => {
            if (!editTarget) return;
            const name = editName.trim();
            if (!name) {
              showInfo('Error', 'Ingresa un nombre.');
              return;
            }
            setIsProcessing(true);
            try {
              await updateCardName(editTarget.id, name);
              setEditTarget(null);
              await refreshCards();
            } catch {
              showInfo('Error', 'No se pudo guardar el nombre.');
            } finally {
              setIsProcessing(false);
            }
          }}
        >
          <Text appearance="hint" style={styles.editHint}>
            Este nombre es solo referencial para identificar tu tarjeta.
          </Text>
          <Input
            value={editName}
            onChangeText={setEditName}
            placeholder="Nombre de la tarjeta"
            disabled={isProcessing}
            maxLength={60}
          />
        </ConfirmPopup>

        <ScrollView
          ref={scrollViewRef}
          style={globalStyles.scroll}
          contentContainerStyle={[
            globalStyles.scrollContent,
            styles.listContent,
            { paddingTop: insets.top + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {cards.length === 0 ? (
            <EmptyStateLayout
              title="Sin tarjetas"
              subtitle="Añade una para pagar con One Click."
              icon={{ name: 'credit-card', iconStyle: 'solid' }}
            />
          ) : (
            cards.map(card => {
              const title = card.displayName?.trim()
                ? card.displayName.trim()
                : prettyCardMeta(card);
              return (
                <Layout
                  key={card.id}
                  level="2"
                  style={[styles.card, { borderColor: colors.border }]}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardLine, { color: colors.text }]}>
                      {title}
                    </Text>
                    {card.isDefault ? (
                      <Text
                        style={[styles.defaultBadge, { color: colors.primary }]}
                      >
                        Predeterminada
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                    {prettyCardMeta(card)}
                  </Text>

                  <View style={styles.rowActions}>
                    <Button
                      appearance="outline"
                      status="basic"
                      disabled={isProcessing}
                      onPress={() => openEdit(card)}
                      style={styles.rowBtn}
                    >
                      Editar nombre
                    </Button>
                    {!card.isDefault ? (
                      <Button
                        appearance="outline"
                        status="primary"
                        disabled={isProcessing}
                        onPress={async () => {
                          setIsProcessing(true);
                          try {
                            await setDefaultCard(card.id);
                            await refreshCards();
                          } catch {
                            showInfo(
                              'Error',
                              'No se pudo marcar como predeterminada.',
                            );
                          } finally {
                            setIsProcessing(false);
                          }
                        }}
                        style={styles.rowBtn}
                      >
                        Predeterminada
                      </Button>
                    ) : null}
                    <Button
                      appearance="outline"
                      status="danger"
                      disabled={isProcessing}
                      onPress={() => setDeleteTarget(card)}
                      style={styles.rowBtn}
                    >
                      Eliminar
                    </Button>
                  </View>
                </Layout>
              );
            })
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
            },
          ]}
        >
          <ButtonPrimary
            title={isProcessing ? 'Abriendo...' : 'Añadir tarjeta'}
            onPress={handleStartInscription}
            disabled={isProcessing}
            style={styles.addButton}
          />
        </View>
      </Layout>
      {InfoDialog}
    </Fragment>
  );
};

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  cardLine: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 13,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  defaultBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowActions: {
    marginTop: 14,
    gap: 10,
  },
  rowBtn: {
    marginTop: 0,
  },
  footer: {
    paddingTop: 8,
  },
  addButton: {
    width: '100%',
  },
  editHint: {
    marginBottom: 10,
  },
});
