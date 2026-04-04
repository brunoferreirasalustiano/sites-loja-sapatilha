const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const app = express();

// 1. Pegar as chaves do Ambiente do Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 2. CRIA O CLIENTE 
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. Configurações de Cache e Pastas
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/imagens-sapatilhas', express.static(path.join(__dirname, 'public/imagens-sapatilhas')));

const upload = multer({ dest: './uploads/' });

// 4. ROTA DE PRODUTOS
app.get('/api/produtos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error("Erro Supabase:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 5. ROTA DE ATUALIZAR
app.post('/api/atualizar-produto/:id', upload.single('foto'), async (req, res) => {
    const { id } = req.params;
    const { nome, preco, tamanhos } = req.body;
    let updateData = { nome, preco: parseFloat(preco), tamanhos };

    if (req.file) {
        updateData.imagem_url = `/uploads/${req.file.filename}`;
    }

    try {
        const { error } = await supabase.from('produtos').update(updateData).eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. LOGIN
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '1234') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Acesso negado" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Servidor rodando na porta ${PORT}`));