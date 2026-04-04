const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const app = express();

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// CONFIGURAÇÃO DE CACHE
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/imagens-sapatilhas', express.static(path.join(__dirname, 'public/imagens-sapatilhas')));

const upload = multer({ dest: './uploads/' });

// ROTA: LISTAR PRODUTOS (Vindo do Supabase)
app.get('/api/produtos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA: ATUALIZAR PRODUTO 
app.post('/api/atualizar-produto/:id', upload.single('foto'), async (req, res) => {
    const { id } = req.params;
    const { nome, preco, tamanhos } = req.body;

    let updateData = { 
        nome, 
        preco: parseFloat(preco), 
        tamanhos 
    };

    if (req.file) {
        updateData.imagem_url = `/uploads/${req.file.filename}`;
    }

    try {
        const { data, error } = await supabase
            .from('produtos')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ROTA: LOGIN
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '1234') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Usuário ou senha inválidos" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Servidor Profissional rodando na porta ${PORT}`));