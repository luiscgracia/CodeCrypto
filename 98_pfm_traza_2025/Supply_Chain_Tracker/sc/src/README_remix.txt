Este es un contrato inteligente de SupplyChainTracker para rastrear tokens (que representan mercancías) a través de una cadena de suministro con control de acceso basado en roles.

Componentes principales

Roles y estados:
Roles de usuario: Productor → Fábrica → Minorista → Consumidor (aplicado a través de _isNextRole).
Estado del usuario: Pendiente/Aprobado/Rechazado/Cancelado (gestionado por el administrador).
Estado de la transferencia: Pendiente/Aceptada/Rechazada.

Estructuras:
Token: Representa un producto (ID, creador, nombre, suministro, características, ID principal, saldos).
Transferencia: Rastrea los movimientos de tokens (ID, remitente/destinatario, ID del token, cantidad, estado).
Usuario: Almacena los datos del usuario (ID, dirección, rol, estado).

Funciones clave:

Gestión de usuarios:
requestUserRole: los usuarios solicitan un rol (comienza como pendiente).
changeStatusUser: el administrador aprueba/rechaza a los usuarios.

Gestión de tokens:
createToken: los usuarios aprobados crean tokens (por ejemplo, productos).
transfer: inicia una transferencia de tokens (valida roles/saldos).

Flujo de trabajo de transferencia:
aceptarTransferencia: El destinatario confirma la transferencia (actualiza los saldos).
rechazarTransferencia: El destinatario/administrador cancela la transferencia (reembolsa al remitente).

Consultas:
obtenerTokensUsuario, obtenerTransferenciasUsuario: Enumera los tokens/transferencias de un usuario.

Control de acceso:
Solo los usuarios autorizados pueden crear tokens/transferencias.
Las transferencias deben seguir la jerarquía de roles (por ejemplo, fábrica → minorista).
Los consumidores no pueden transferir tokens (final de la cadena).

Eventos:
Emite registros de acciones de tokens/transferencias/usuarios (por ejemplo, TokenCreated, TransferAccepted).

Caso de uso
Modela una cadena de suministro en la que:

Los productores crean tokens (productos).
Las fábricas/minoristas transfieren tokens aguas abajo.
Los consumidores reciben tokens (paso final).
El administrador gestiona las aprobaciones de los usuarios.

Notas de seguridad
Los usos requieren la validación de la entrada.
Las transiciones de roles se aplican de forma estricta.
El administrador tiene funciones privilegiadas (por ejemplo, changeStatusUser).

Mejoras potenciales (si se solicitan):
Optimización del gas para bucles en getUserTokens/getUserTransfers.
Utilizar SafeMath (aunque Solidity ^0.8.x tiene comprobaciones de desbordamiento integradas).
Añadir modificadores para comprobaciones repetidas (por ejemplo, onlyAdmin).

