# Room Reservation Web App

A simple and modern **room reservation web application** built with **Next.js**.

---

##  Features

- Browse and select available rooms  
- Book rooms with date & time selection  
- Store reservations 

---

## Tech Stack

| Tool | Purpose |
|------|----------|
| **Next.js** | React framework for the frontend |
| **React** | Component-based UI library |
| **JavaScript/TypeScript** | Main programming languages |
| **Tailwind CSS** | Utility-first CSS framework for styling |
| **Node.js** | Runtime environment |
| **Turbopack** | Fast bundler for development |
| **ESLint** | Linting and code quality checks |

---


---

##  Authentication & Middleware Notice

The current middleware used for authentication and cookie handling
works **only with Next.js 16**.

Starting with **Next.js 17+**, changes to the Edge Runtime prevent
reliable cookie setting inside middleware.

**Required Migration**
For Next.js 17+, the authentication and cookie logic must be moved to
a **proxy-based solution** (e.g. API Routes or an external backend),
where cookies are set server-side.

The middleware should then only be used for:
- routing
- access control
- redirects


## Project Structure

```
room-reservation/
├── app/
│ ├── page.js # Home page (entry point)
│ ├── layout.js # Shared layout (header, footer, metadata)
│ └── globals.css # Global styles
├── public/ # Static assets (images, icons, etc.)
├── package.json
├── next.config.js
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash 
git clone https://github.com/monaenzi/room_reservation_system.git
cd room_reservation_system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser to view it.

---

## Requirements
- Node.js 18+  
- npm 9+ or pnpm/yarn  

---

## Authors

### Alamer Alia
- GitHub profile: [Alia-Alamer](https://github.com/Alia-Alamer)
- alia.alamer@edu.fh-joanneum.at

### Enzi Ramona
- GitHub profile: [monaenzi](https://github.com/monaenzi)
- ramona.enzi@edu.fh-joanneum.at

### Kadyrova Linda
- GitHub profile: [lindakadyrova](https://github.com/lindakadyrova)
- linda.kadyrova@edu.fh-joanneum.at

### Wychodil-Lubi Lucas
- GitHub profile: [lucaswychodil](https://github.com/lucaswychodil)
- lucas.wychodil-lubi@edu.fh-joanneum.at

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

