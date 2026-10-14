const express = require('express');
const pool = require('./db');
const app = express();
app.use(express.json());
// LISTAR tarefas (com filtro opcional por status)
app.get('/tarefas', async (req, res) => {
   try {
      //Pra ajudar a achar erros as vezes e bom colocar um console.log mostrando que chega em certo canto
      const { concluida } = req.query;
      let query = 'SELECT * FROM tarefas';
      let params = [];
      if (concluida !== undefined) {
         query += ' WHERE concluida = $1';
         params.push(concluida === 'true');
      }
      query += ' ORDER BY id';
      const resultado = await pool.query(query, params);
      res.json(resultado.rows);
   } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar tarefas' });
   }
});
// BUSCAR uma tarefa especifica
app.get('/tarefas/:id', async (req, res) => {
   try {
      const resultado = await pool.query('SELECT * FROM tarefas WHERE id = $1', [req.params.id]);
      if (resultado.rows.length === 0) {
         return res.status(404).json({ erro: 'Tarefa nao encontrada' });
      }
      res.json(resultado.rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar tarefa' });
   }
});
// CRIAR uma nova tarefa
app.post('/tarefas', async (req, res) => {
   try {
      const { titulo } = req.body;
      if (!titulo) return res.status(400).json({ erro: 'O campo "titulo" e obrigatorio' });
      const resultado = await pool.query(
         'INSERT INTO tarefas (titulo) VALUES ($1) RETURNING *',
         [titulo]
      );
      res.status(201).json(resultado.rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao criar tarefa' });
   }
});
// ATUALIZAR uma tarefa
app.put('/tarefas/:id', async (req, res) => {
   try {
      //Se quisesse evoluir aplicar jwt pra verificar se o usuario que ta atualizando e o mesmo que criou
      const { titulo, concluida } = req.body;
      const tarefaAtual = await pool.query('SELECT * FROM tarefas WHERE id = $1', [req.params.id]);
      if (tarefaAtual.rows.length === 0) {
         return res.status(404).json({ erro: 'Tarefa nao encontrada' });
      }
      const atual = tarefaAtual.rows[0];
      const novoTitulo = titulo !== undefined ? titulo : atual.titulo;
      const novaConcluida = concluida !== undefined ? concluida : atual.concluida;
      const resultado = await pool.query(
         'UPDATE tarefas SET titulo = $1, concluida = $2 WHERE id = $3 RETURNING *',
         [novoTitulo, novaConcluida, req.params.id]
      );
      res.json(resultado.rows[0]);
   } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
   }
});
// DELETAR uma tarefa
app.delete('/tarefas/:id', async (req, res) => {
   try {
      //Se quisesse evoluir aplicar jwt pra verificar se o usuario que ta deletando e o mesmo que criou
      const resultado = await pool.query('DELETE FROM tarefas WHERE id = $1 RETURNING *', [req.params.id])
      //Aqui tinha um erro que o if tava na linha e tava faltando o final do req.params.id e o fechamento dos colchetes
      if (resultado.rows.length === 0) {
         return res.status(404).json({ erro: 'Tarefa nao encontrada' });
      }
      res.status(204).send();
   } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao deletar tarefa' });
   }
});
app.listen(3000, () => console.log('API rodando na porta 3000'));