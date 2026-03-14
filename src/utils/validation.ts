import { z } from "zod";

export const CamaradaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  curso: z.string().min(2, "Curso deve ter pelo menos 2 caracteres"),
  turnos: z.array(z.enum(["manha", "tarde", "noite"])).min(1, "Selecione pelo menos um turno"),
});

export const ItemEstoqueSchema = z.object({
  id: z.string().optional(),
  produto: z.string().min(2, "Nome do produto é obrigatório"),
  uso_semanal: z.number().min(0, "Uso semanal deve ser positivo"),
  unidades: z.number().min(0, "Unidades em estoque deve ser positivo"),
});

export const VendaSchema = z.object({
  id: z.string().optional(),
  data: z.string().min(10, "Data inválida"),
  unidades: z.number().min(1, "Quantidade mínima é 1"),
  preco_unitario: z.number().min(0, "Preço deve ser positivo"),
});

export const CASchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, "Nome do CA é obrigatório"),
  status: z.enum(["aliado", "neutro"]),
  relacao: z.string().optional(),
});

export const AgendaSchema = z.object({
  id: z.string().optional(),
  data: z.string().min(10, "Data inválida"),
  titulo: z.string().min(2, "Título é obrigatório"),
  notas: z.string().optional(),
});
