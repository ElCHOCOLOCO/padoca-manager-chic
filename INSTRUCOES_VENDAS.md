# 📊 Instruções para Configurar Projeção de Vendas

## 🎯 **Passo 1: Executar o SQL de Inserção dos Institutos**

Execute o seguinte SQL no seu Supabase SQL Editor:

```sql
-- =====================================================
-- INSERIR INSTITUTOS DE VENDAS
-- =====================================================

-- Inserir os institutos específicos para vendas
INSERT INTO institutos_vendas (codigo, nome, turno) VALUES
-- IAD - Instituto de Artes e Design
('IAD M', 'Instituto de Artes e Design', 'manha'),
('IAD T', 'Instituto de Artes e Design', 'tarde'),

-- DIR - Direito
('DIR M', 'Direito', 'manha'),
('DIR T', 'Direito', 'tarde'),
('DIR N', 'Direito', 'noite'),

-- ENF - Enfermagem
('ENF M', 'Enfermagem', 'manha'),
('ENF T', 'Enfermagem', 'tarde'),

-- BIO - Biologia
('BIO M', 'Biologia', 'manha'),
('BIO T', 'Biologia', 'tarde'),

-- ICH - Instituto de Ciências Humanas
('ICH M', 'Instituto de Ciências Humanas', 'manha'),
('ICH T', 'Instituto de Ciências Humanas', 'tarde'),
('ICH N', 'Instituto de Ciências Humanas', 'noite'),

-- ICE - Instituto de Ciências Exatas
('ICE M', 'Instituto de Ciências Exatas', 'manha'),
('ICE T', 'Instituto de Ciências Exatas', 'tarde'),

-- FAU - Faculdade de Arquitetura e Urbanismo
('FAU M', 'Faculdade de Arquitetura e Urbanismo', 'manha'),
('FAU T', 'Faculdade de Arquitetura e Urbanismo', 'tarde'),

-- FAMED - Faculdade de Medicina
('FAMED M', 'Faculdade de Medicina', 'manha'),
('FAMED T', 'Faculdade de Medicina', 'tarde'),

-- FACED - Faculdade de Educação
('FACED M', 'Faculdade de Educação', 'manha'),
('FACED T', 'Faculdade de Educação', 'tarde'),
('FACED N', 'Faculdade de Educação', 'noite'),

-- FACOM - Faculdade de Comunicação
('FACOM M', 'Faculdade de Comunicação', 'manha'),
('FACOM T', 'Faculdade de Comunicação', 'tarde')
ON CONFLICT (codigo) DO NOTHING;
```

## 🎯 **Passo 2: Verificar se os Institutos Foram Inseridos**

Execute esta consulta para verificar:

```sql
-- Verificar se os institutos foram inseridos
SELECT 
    codigo,
    nome,
    turno,
    created_at
FROM institutos_vendas 
ORDER BY codigo;

-- Contar total de institutos inseridos
SELECT COUNT(*) as total_institutos_vendas FROM institutos_vendas;
```

**Resultado esperado:** 23 institutos inseridos.

## 🎯 **Passo 3: Acessar a Funcionalidade**

1. **Acesse a aplicação** no seu navegador
2. **Clique na aba "Vendas"** no menu principal
3. **Você verá a matriz cartesiana** com todos os 23 institutos na lateral esquerda

## 🎯 **Funcionalidades Disponíveis:**

### **📊 Matriz de Vendas:**
- **23 institutos** na lateral esquerda (IAD M/T, DIR M/T/N, ENF M/T, BIO M/T, ICH M/T/N, ICE M/T, FAU M/T, FAMED M/T, FACED M/T/N, FACOM M/T)
- **5 dias da semana** nas colunas (Segunda a Sexta)
- **Células editáveis** clicando nelas
- **Projeção vs Vendas Reais** em cada célula
- **Percentual de acerto** com cores indicativas

### **📈 Análise de Oferta e Demanda:**
- Criar análises por instituto, dia e turno
- Calcular déficit/superávit automaticamente
- Visualizar status de cobertura

### **🎯 Metas de Vendas:**
- Definir metas por período (diária, semanal, mensal, semestral)
- Acompanhar performance por instituto

### **📊 Dashboard:**
- Métricas gerais de vendas
- Performance por turno
- Ranking dos institutos

## 🎯 **Como Usar:**

1. **Editar Projeções:** Clique em qualquer célula da matriz
2. **Inserir Valores:** Digite a projeção e vendas reais
3. **Salvar:** Clique no botão ✓ para salvar
4. **Cancelar:** Clique no botão × para cancelar

## 🎯 **Recursos Visuais:**

- **Células vazias:** Mostram "Clique para editar"
- **Células com dados:** Mostram projeção (azul) e vendas reais (verde)
- **Percentual de acerto:** Badge colorido (verde ≥90%, amarelo ≥70%, vermelho <70%)
- **Coluna lateral fixa:** Instituto sempre visível ao rolar horizontalmente

## ✅ **Status:**

- ✅ Frontend implementado e compilado
- ✅ Interface responsiva e intuitiva
- ✅ Tratamento de erros robusto
- ✅ Fallback para funções RPC não disponíveis
- ⏳ **Aguardando:** Execução do SQL de inserção dos institutos

**Execute o SQL e a funcionalidade estará 100% operacional!** 🎉