export interface ApiError {
  status: number
  message: string
  data?: unknown
}

export interface CuentaBancaria {
  banco: string
  tipoCuenta: 'AHORROS' | 'CORRIENTE'
  numeroCuenta: string
}

export interface PeritoEspecialidad {
  areaProfesion: string
  especialidad: string
  ciudad?: string
  fechaSolicitud?: string
  fechaVencimiento?: string
  observaciones?: string
}

export interface Perito {
  _id: string
  codigoRegistro: string
  nombres: string
  apellidos: string
  ruc: string
  direccion?: string
  telefono?: string
  email?: string
  notificationEmails?: string[]
  cuentasBancarias: CuentaBancaria[]
  especialidades: PeritoEspecialidad[]
  fechaVigenciaCalificacion?: string
  fechaVencimientoFirma?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Juez {
  _id: string
  nombres: string
  apellidos: string
  email?: string
  telefono?: string
  isActive: boolean
}

export interface Juzgado {
  _id: string
  nombre: string
  direccion?: string
  ciudad?: string
  zona?: 'CENTRO' | 'NORTE' | 'SUR' | 'OTRO'
  isActive: boolean
}

export interface UnidadJudicial {
  _id: string
  nombre: string
  juzgadoId?: string
  direccion?: string
  ciudad?: string
  zona?: 'CENTRO' | 'NORTE' | 'SUR' | 'OTRO'
  isActive: boolean
}

export interface Cliente {
  _id: string
  nombre: string
  ruc?: string
  direccion?: string
  tipo?: 'BANCO' | 'EMPRESA' | 'PARTICULAR'
  isActive: boolean
}

export type CatalogType = 'jueces' | 'juzgados' | 'unidades-judiciales' | 'clientes'

export interface PeritoRef {
  _id: string
  nombres: string
  apellidos: string
  ruc: string
  codigoRegistro?: string
}

export interface Sorteo {
  _id?: string
  numeroJuicio: string
  actor: string
  demandado: string
  tipoMateria: string
  estado: string
  fechaAsignacion: string
  fechaDesignacion?: string
  dependencia?: string
  ciudad?: string
  juzgado: string
  juez: string
  peritoId?: string | PeritoRef | null
  proceso?: string
  tipoDesignacion?: string
  accionInfraccion?: string
  fechas?: {
    fechaNotificacion?: string
    fechaVencimiento?: string
    fechaPosesion?: string
    fechaRevision?: string
    fechaEntrega?: string
  }
  especialidad?: {
    profesion?: string
    especialidad?: string
  }
  informacionDemandado?: {
    tipoIdentificacion?: string
    identificacion?: string
    opAnteriorTarjeta?: string
    opActualTarjeta?: string
    observacion?: string
  }
  prefactura?: {
    clienteId?: string
    clienteNombre?: string
    clienteRuc?: string
    correo?: string
    item?: string
    valorBaseImponible?: number
    iva?: number
    total?: number
    retencionIva?: number
    retencionFuente?: number
    facturaNo?: string
    fechaEmisionFactura?: string
    retencionNo?: string
    serie?: string
  }
  cobranza?: {
    totalCobranza?: number
    estadoCobranza?: string
    movilidad?: number
    adicional?: number
    medioPago?: string
    cuentaBancaria?: string
    fechaLiquidacion?: string
    fechaCancelacion?: string
    observacion?: string
  }
  contacto?: {
    estudioJuridico?: string
    cliente?: string
    nombre?: string
    direccion?: string
    telefono?: string
    correo?: string
    observacion?: string
  }
  impugnacion?: {
    estado?: string
    fecha?: string
    observacion?: string
  }
  observaciones: string
  activo?: boolean
}

export type SorteoEstado = 'ASIGNADO' | 'EN_PROCESO' | 'DILIGENCIA_PROGRAMADA' | 'INFORME_ENTREGADO' | 'FACTURADO' | 'CERRADO'

export type FacturaEstado = 'POR_FACTURAR' | 'EMITIDA' | 'AUTORIZADA' | 'RECHAZADA'

export interface Factura {
  _id: string
  numeroFactura: string
  sorteoId?: string
  peritoId: string | PeritoRef
  clienteId?: string
  clienteNombre: string
  clienteRuc: string
  fechaEmision: string
  subtotal: number
  iva: number
  total: number
  estado: FacturaEstado
  observaciones: string
  activo?: boolean
}

export type EscritoTipo = 'DEMANDA' | 'CONTESTACION' | 'PRUEBA' | 'ALEGATO' | 'SENTENCIA' | 'OTRO'
export type EscritoEstado = 'PRESENTADO' | 'NOTIFICADO' | 'RESUELTO' | 'ARCHIVADO'

export interface Escrito {
  _id: string
  sorteoId: string | { _id: string; numeroJuicio: string; materia: string; actor: string; demandado: string }
  tipo: EscritoTipo
  fechaPresentacion: string
  fechaNotificacion?: string
  estado: EscritoEstado
  archivoUrl?: string
  observaciones: string
  activo?: boolean
  createdAt?: string
  updatedAt?: string
}

export type GestionCobroTipo = 'VISITA' | 'LLAMADA' | 'CORREO' | 'NOTIFICACION_JUDICIAL'
export type GestionCobroResultado = 'PENDIENTE' | 'CONTACTO_EXITOSO' | 'PROMESA_PAGO' | 'PAGO_PARCIAL' | 'PAGO_TOTAL' | 'SIN_RESULTADO'

export interface BitacoraCobro {
  _id: string
  sorteoId: string | { _id: string; numeroJuicio: string; actor: string; demandado: string }
  cobradorId: string | { _id: string; name: string; email: string }
  fecha: string
  tipoGestion: GestionCobroTipo
  resultado: GestionCobroResultado
  proximaAccion: string
  proximaFecha?: string
  observaciones: string
  activo?: boolean
  createdAt?: string
  updatedAt?: string
}

export type DiligenciaTipo = 'NOTIFICACION' | 'INSPECCION' | 'RECEPCION' | 'ENTREGA_INFORME' | 'COBRO'
export type DiligenciaEstado = 'PROGRAMADA' | 'EN_CURSO' | 'REALIZADA' | 'CANCELADA'

export interface AgendaCampo {
  _id: string
  sorteoId: string | { _id: string; numeroJuicio: string; materia: string; actor: string; demandado: string }
  peritoId: string | { _id: string; nombres: string; apellidos: string }
  cobradorId?: string | { _id: string; name: string; email: string }
  fechaHora: string
  tipoDiligencia: DiligenciaTipo
  direccion: string
  latitud?: number
  longitud?: number
  estado: DiligenciaEstado
  observaciones: string
  activo?: boolean
  createdAt?: string
  updatedAt?: string
}

export type TipoMovimientoCaja = 'INGRESO' | 'EGRESO'
export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA'

export interface CajaMovimiento {
  _id: string
  fecha: string
  tipoMovimiento: TipoMovimientoCaja
  monto: number
  concepto: string
  peritoId?: string | { _id: string; nombres: string; apellidos: string }
  sorteoId?: string | { _id: string; numeroJuicio: string }
  formaPago: FormaPago
  referencia: string
  registradoPor: string | { _id: string; name: string; email: string }
  observaciones: string
  activo?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CajaResumen {
  ingresos: number
  egresos: number
  balance: number
}

export type AccessLogAccion = 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'ACCESS_BLOCKED'
export type AccessLogResultado = 'EXITOSO' | 'FALLIDO' | 'BLOQUEADO'

export interface AccessLog {
  _id: string
  userId?: string | { _id: string; name: string; email: string }
  email: string
  ip: string
  accion: AccessLogAccion
  resultado: AccessLogResultado
  createdAt: string
  updatedAt: string
}

export type LiquidacionEstado = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'RECHAZADA'

export interface LiquidacionDetalle {
  sorteoId: string
  honorarios: number
  descuentos: number
}

export interface Liquidacion {
  _id: string
  peritoId: string | PeritoRef
  periodo: string
  fechaInicio: string
  fechaFin: string
  detalle: LiquidacionDetalle[]
  totalHonorarios: number
  totalDescuentos: number
  totalAPagar: number
  estado: LiquidacionEstado
  observaciones: string
  activo?: boolean
}
