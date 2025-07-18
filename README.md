# 🧠 Plataforma de Simulados para Concursos de Psicologia

Uma aplicação web interativa e de código aberto, desenvolvida para auxiliar estudantes e profissionais de psicologia na preparação para concursos públicos e exames. A plataforma utiliza um banco de questões robusto, extraído de materiais de estudo e provas reais, oferecendo uma experiência de estudo dinâmica e eficaz.

<!-- Sugestão: Tire uma captura de ecrã da sua aplicação e substitua o URL -->

## ✨ Funcionalidades

* 📚 **Banco de Questões Extenso:** Mais de 150 questões divididas por temas-chave: Psicologia Educacional, Código de Ética, Psicopatologia I e II.
* 🧠 **Dois Modos de Simulado:**
    * **Modo Prática:** Receba feedback instantâneo após cada resposta, com justificativas detalhadas para auxiliar na aprendizagem.
    * **Modo Prova:** Simule um ambiente de exame real, respondendo a 10 questões sorteadas e recebendo o resultado completo apenas no final.
* 📊 **Acompanhamento de Progresso:** O sistema memoriza as questões já respondidas em cada tema, garantindo que novas questões sejam apresentadas em cada simulado. O progresso é visível no menu principal.
* 🎨 **Interface Moderna e Responsiva:** Design limpo e agradável, construído com Tailwind CSS, que se adapta a qualquer dispositivo (desktop, tablet ou telemóvel), com temas claro e escuro.
* 🔍 **Revisão Detalhada:** Após cada simulado, pode rever todas as suas respostas, compará-las com o gabarito e ler as justificativas para cada questão.
* 🗑️ **Gestão de Histórico:** Opção para limpar todo o seu progresso e recomeçar os estudos do zero.

## 🚀 Como Utilizar

### Online (Recomendado)

A forma mais fácil de utilizar a plataforma é através de um serviço de hospedagem como a **Vercel** ou o **GitHub Pages**.

1.  **Fork este repositório:** Crie uma cópia deste projeto na sua conta do GitHub.
2.  **Importe na Vercel:**
    * Crie uma conta na [Vercel](https://vercel.com) com o seu perfil do GitHub.
    * Importe o repositório que acabou de criar.
    * A Vercel irá automaticamente fazer o deploy do site. Não são necessárias configurações adicionais.

### Localmente

Para executar o projeto no seu computador, é necessário utilizar um servidor local devido às políticas de segurança dos navegadores que bloqueiam o carregamento de ficheiros (`fetch API`) diretamente do sistema de ficheiros (`file:///`).

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
    cd seu-repositorio
    ```
2.  **Inicie um servidor local:** Se tiver o VS Code, pode usar a extensão "Live Server". Se tiver o Python instalado, pode executar um dos seguintes comandos na pasta do projeto:
    ```bash
    # Python 3
    python -m http.server
    # Python 2
    python -m SimpleHTTPServer
    ```
3.  Abra o seu navegador e aceda a `http://localhost:8000` (ou o endereço fornecido pelo Live Server).

## 🛠️ Estrutura do Projeto

* `index.html`: O ficheiro principal que contém toda a estrutura, estilos (via CDN) e a lógica da aplicação em JavaScript.
* `bancoDeQuestoes.json`: O ficheiro que armazena todas as questões do simulado no formato JSON, separado da lógica da aplicação para facilitar a manutenção e atualização.

## 💻 Tecnologias Utilizadas

* **HTML5**
* **CSS3** com **Tailwind CSS** (via CDN)
* **JavaScript (ES6+)** (Vanilla JS, sem frameworks)
* **Lucide Icons** (para os ícones)

## 🤝 Contribuições

Contribuições são bem-vindas! Se encontrar um bug, tiver uma sugestão de melhoria ou quiser adicionar mais questões, sinta-se à vontade para abrir uma *Issue* ou um *Pull Request*.

1.  Faça um Fork do projeto.
2.  Crie uma nova branch (`git checkout -b feature/nova-funcionalidade`).
3.  Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`).
4.  Faça push para a branch (`git push origin feature/nova-funcionalidade`).
5.  Abra um Pull Request.

## 📜 Licença

Este projeto está licenciado sob a Licença MIT. Veja o ficheiro `LICENSE` para mais detalhes.
