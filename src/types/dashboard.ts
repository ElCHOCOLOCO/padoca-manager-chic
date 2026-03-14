import { DiaSemana, Turno } from '../constants/dashboard';

export interface HorarioDisponivel {
  dia: DiaSemana;
  turno: Turno;
}

export interface Camarada {
  id: string;
  nome: string;
  curso: string;
  turnos: Turno[];
  horarios_disponiveis?: HorarioDisponivel[];
}

export interface ItemEstoque {
  id: string;
  produto: string;
  uso_semanal: number;
  unidades: number;
}

export interface AgendaItem {
  id: string;
  data: string;
  titulo: string;
  notas?: string;
}

export interface Instituto {
  id: string;
  nome: string;
  turno: string;
  vagas: number;
}

export interface EscalaItem {
  id: string;
  camarada_id: string;
  instituto_id: string;
  dia: DiaSemana;
  turno: Turno;
}
