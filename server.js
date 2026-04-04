const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const app = express();

// 1. CONFIGURAÇÃO DO SUPABASE (Puxando do Render)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. CONFIGURAÇÃO DO MULTER (Para receber as fotos)
const upload = multer({ dest: './uploads/' });

// 3. MIDDLEWARES E PASTAS
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/imagens-sapatilhas', express.static(path.join(__dirname, 'public/imagens-sapatilhas')));

// 4. ROTA: LISTAR PRODUTOS
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

// 5. ROTA: ATUALIZAR PRODUTO (MODO PROFISSIONAL COM STORAGE)
app.post('/api/atualizar-produto/:id', upload.single('foto'), async (req, res) => {
    const { id } = req.params;
    const { nome, preco, tamanhos } = req.body;
    let imagem_url = null;

    try {
        if (req.file) {
            const fileExt = path.extname(req.file.originalname);
            const fileName = `${id}-${Date.now()}${fileExt}`;
            const filePath = req.file.path;
            const fileBuffer = fs.readFileSync(filePath);

            // Sobe para o Bucket do Supabase
            const { error: uploadError } = await supabase.storage
                .from('fotos-sapatilhas')
                .upload(fileName, fileBuffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Pega a URL pública
            const { data: publicUrlData } = supabase.storage
                .from('fotos-sapatilhas')
                .getPublicUrl(fileName);

            imagem_url = publicUrlData.publicUrl;
            fs.unlinkSync(filePath); // Apaga o arquivo temporário
        }

        let updateData = { nome, preco: parseFloat(preco), tamanhos };
        if (imagem_url) {
            updateData.imagem_url = imagem_url;
        }

        const { error: dbError } = await supabase.from('produtos').update(updateData).eq('id', id);
        if (dbError) throw dbError;

        res.json({ success: true });
    } catch (error) {
        console.error("Erro no upload/update:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. ROTA DE LOGIN
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '1234') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Acesso negado" });
    }
});

// 7. SISTEMA ANTI-SONO (KEEP-ALIVE)
const URL_DO_SITE = "https://depietrisapatilhas.onrender.com";
const manterAcordado = async () => {
    try {
        await axios.get(`${URL_DO_SITE}/api/produtos`);
        await supabase.from('produtos').select('id').limit(1);
        console.log("✅ Sistema Online e Aquecido!");
    } catch (err) {
        console.error("❌ Erro no Auto-Ping:", err.message);
    }
};
setInterval(manterAcordado, 600000);

// 8. INICIALIZAÇÃO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Servidor De Pietri rodando na porta ${PORT}`);
    manterAcordado();
});