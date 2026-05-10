import { Button, Input, Text } from '@ui-kitten/components';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteCard,
  getCards,
  getInscriptionRedirectUrl,
  type OneClickCard,
  setDefaultCard,
  startInscription,
  updateCardName,
} from '../../../modules/session/oneclick';
import { ButtonPrimary } from '../../../shared/components/ui/button/ButtonPrimary';
import { ConfirmPopup } from '../../../shared/components/ui/popup/ConfirmPopup';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

const ONECLICK_DEEP_LINK = 'amperex://oneclick-inscription-success';
const ONECLICK_DEEP_LINK_FAILED = 'amperex://oneclick-inscription-failed';

function getQueryParam(url: string, key: string): string | null {
  const qIdx = url.indexOf('?');
  if (qIdx < 0) return null;
  const query = url.slice(qIdx + 1);
  for (const part of query.split('&')) {
    const [k, v] = part.split('=');
    if (!k) continue;
    if (decodeURIComponent(k) === key) return v ? decodeURIComponent(v) : '';
  }
  return null;
}

export const TarjetasScreen = () => {
  const colors = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<OneClickCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OneClickCard | null>(null);
  const [editTarget, setEditTarget] = useState<OneClickCard | null>(null);
  const [editName, setEditName] = useState('');

  const refreshCards = useCallback(async () => {
    try {
      const res = await getCards();
      setCards(res.cards ?? []);
    } catch {
      setCards([]);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    await refreshCards();
    setLoading(false);
  }, [refreshCards]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      if (event.url === ONECLICK_DEEP_LINK) {
        void refreshCards();
      }
      if (event.url.startsWith(ONECLICK_DEEP_LINK_FAILED)) {
        const code = getQueryParam(event.url, 'code');
        Alert.alert(
          'No se pudo inscribir la tarjeta',
          code
            ? `La inscripción fue rechazada (código ${code}). Verifica los datos e inténtalo nuevamente. Si el problema persiste, prueba con otra tarjeta o contacta a tu banco.`
            : 'La inscripción fue rechazada. Intenta de nuevo. Si el problema persiste, prueba con otra tarjeta o contacta a tu banco.',
        );
        void refreshCards();
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url === ONECLICK_DEEP_LINK) void refreshCards();
      if (url?.startsWith(ONECLICK_DEEP_LINK_FAILED)) {
        const code = getQueryParam(url, 'code');
        Alert.alert(
          'No se pudo inscribir la tarjeta',
          code
            ? `La inscripción fue rechazada (código ${code}). Verifica los datos e inténtalo nuevamente. Si el problema persiste, prueba con otra tarjeta o contacta a tu banco.`
            : 'La inscripción fue rechazada. Intenta de nuevo. Si el problema persiste, prueba con otra tarjeta o contacta a tu banco.',
        );
        void refreshCards();
      }
    });
    return () => sub.remove();
  }, [refreshCards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCards();
    setRefreshing(false);
  }, [refreshCards]);

  const handleStartInscription = async () => {
    setIsProcessing(true);
    try {
      const { token } = await startInscription();
      const url = getInscriptionRedirectUrl(token);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir el enlace de inscripción.');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      Alert.alert(
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.muted, { color: colors.textSecondary }]}>
            Cargando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
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
          <Text style={[styles.mutedBlock, { color: colors.textSecondary }]}>
            No tienes tarjetas inscritas.
          </Text>
        ) : (
          cards.map((c) => {
            const title = c.displayName?.trim()
              ? c.displayName.trim()
              : prettyCardMeta(c);
            return (
              <View
                key={c.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginTop: 12 },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardLine, { color: colors.text }]}>{title}</Text>
                  {c.isDefault ? (
                    <Text style={[styles.defaultBadge, { color: colors.primary }]}>
                      Predeterminada
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  {prettyCardMeta(c)}
                </Text>

                <View style={styles.rowActions}>
                  <Button
                    appearance="outline"
                    status="basic"
                    disabled={isProcessing}
                    onPress={() => openEdit(c)}
                    style={styles.rowBtn}
                  >
                    Editar nombre
                  </Button>
                  {!c.isDefault ? (
                    <Button
                      appearance="outline"
                      status="primary"
                      disabled={isProcessing}
                      onPress={async () => {
                        setIsProcessing(true);
                        try {
                          await setDefaultCard(c.id);
                          await refreshCards();
                        } catch {
                          Alert.alert('Error', 'No se pudo marcar como predeterminada.');
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
                    onPress={() => setDeleteTarget(c)}
                    style={styles.rowBtn}
                  >
                    Eliminar
                  </Button>
                </View>
              </View>
            );
          })
        )}
        <ButtonPrimary
          title={isProcessing ? 'Abriendo...' : 'Añadir tarjeta'}
          onPress={handleStartInscription}
          disabled={isProcessing}
          style={styles.buttonSpacing}
        />
      </ScrollView>

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
            Alert.alert('Listo', 'La tarjeta se eliminó correctamente.');
          } catch (err: unknown) {
            const message =
              err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            Alert.alert('Error', message ?? 'No se pudo eliminar la tarjeta. Intenta de nuevo.');
          } finally {
            setIsProcessing(false);
          }
        }}
      >
        <Text appearance="hint">
          ¿Seguro que deseas eliminar esta tarjeta? Tendrás que volver a inscribirla para pagar con One Click.
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
            Alert.alert('Error', 'Ingresa un nombre.');
            return;
          }
          setIsProcessing(true);
          try {
            await updateCardName(editTarget.id, name);
            setEditTarget(null);
            await refreshCards();
          } catch {
            Alert.alert('Error', 'No se pudo guardar el nombre.');
          } finally {
            setIsProcessing(false);
          }
        }}
      >
        <Text appearance="hint" style={{ marginBottom: 10 }}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  muted: {
    marginTop: 8,
    fontSize: 14,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardLine: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 13,
  },
  buttonSpacing: {
    marginTop: 4,
  },
  mutedBlock: {
    marginTop: 14,
    textAlign: 'center',
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
});
