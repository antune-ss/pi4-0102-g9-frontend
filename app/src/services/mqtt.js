import mqtt from 'mqtt';

const MQTT_URL = import.meta.env.VITE_MQTT_WS_URL || 'ws://localhost:9001'
const MQTT_USER = import.meta.env.VITE_MQTT_USER
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD

/**
 * Conecta ao Broker MQTT via WebSocket.
 * 
 * Localmente: ws://localhost:9001
 * Na nuvem (EMQX): wss://f082ab82.ala.us-east-1.emqxsl.com:8084
 */
export function initMqttConn(onRead, onStatus) {
	console.log('[MQTT] Conectando ao broker em:', MQTT_URL)

	const client = mqtt.connect(MQTT_URL, {
		clientId: 'co2nect-web-' + Math.random().toString(16).substring(2, 8),
		username: MQTT_USER,
    password: MQTT_PASSWORD,
		clean: true,
		reconnectPeriod: 3000, // Tenta reconectar a cada 3s caso caia
	})

	client.on('connect', () => {
		console.log('[MQTT] Conectado ao broker com sucesso.')

		const topics = ['co2nect/+/telemetry', 'co2nect/+/status']
		client.subscribe(topics, (err) => {
			if (err) {
				console.error('[MQTT] Falha ao assinar tópicos:', err)
			} else {
				console.log('[MQTT] Tápicos assinados com sucesso:', topics)
			}
		})
	})

	client.on('message', (topic, payload) => {
		try {
			const data = JSON.parse(payload.toString())

			if (topic.endsWith('/telemetry')) {
				const fmtReading = {
					id: `mqtt-${Date.now()}`,
					deviceId: data.deviceId || topic.split('/')[1] || 'ESP32',
					data: data.measuredAt || new Date().toISOString(),
					co2: Number(data.co2),
					temperature: Number(data.temperature),
					humidity: Number(data.humidity),
				}

				console.log('[MQTT] Nova medição recebida:', fmtReading)

				if (onRead) {
					onRead(fmtReading)
				}
			} else if (topic.endsWith('/status')) {
				const deviceId = data.deviceId || topic.split('/')[1] || 'ESP32'
				const isOnline = data.status === 1

				console.log(`[MQTT] Status do dispositivo ${deviceId}:`, isOnline ? 'Online' : 'Offline')

				if (onStatus) {
					onStatus({
						deviceId,
						online: isOnline,
						timestamp: new Date().toISOString()
					})
				}
			}
		} catch (e) {
			console.error('[MQTT] Erro ao decodificar JSON recebido:', e)
		}
	})

	client.on('error', (err) => {
    console.error('[MQTT] Erro no cliente MQTT:', err)
  })

	// Retorna função para desconectar quando o React desmontar o componente
	return () => {
    console.log('[MQTT] Fechando conexão com o broker...')
    client.end()
  }
}
