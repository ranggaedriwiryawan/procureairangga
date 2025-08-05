// main.js
import { initSimulation, loadHistory } from './simulation.js';

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000'; // URL backend

    // --- LOGIKA DARK MODE --- (tidak berubah)
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;

    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            document.getElementById('theme-icon').innerHTML = moonIcon;
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            document.getElementById('theme-icon').innerHTML = sunIcon;
        }
    };
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme(true);
    } else {
        setTheme(false);
    }
    themeToggle.addEventListener('click', () => {
        setTheme(!document.documentElement.classList.contains('dark'));
    });

    // --- LOGIKA NAVIGASI HALAMAN & TAB (DIPERBARUI) ---
    const pages = document.querySelectorAll('.page');
    const navButtons = {
        dashboard: document.getElementById('nav-dashboard'),
        simulation: document.getElementById('nav-simulation'),
        about: document.getElementById('nav-about'),
    };
    
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const activeTabClasses = ['bg-blue-500', 'text-white'];
    const inactiveTabClasses = ['hover:bg-slate-300', 'dark:hover:bg-slate-600'];

    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.toggle('hidden', page.id !== pageId);
        });
        window.scrollTo(0, 0);
    }
    
    function showTab(tabId) {
        tabs.forEach(tab => {
            const currentTabId = tab.id.split('-')[1];
            if (currentTabId === tabId) {
                tab.classList.add(...activeTabClasses);
                tab.classList.remove(...inactiveTabClasses, 'bg-slate-200', 'dark:bg-slate-800');
            } else {
                tab.classList.remove(...activeTabClasses);
                tab.classList.add(...inactiveTabClasses, 'bg-slate-200', 'dark:bg-slate-800');
            }
        });
        
        tabContents.forEach(content => {
            const contentTabId = content.id.split('-')[1];
            content.classList.toggle('hidden', contentTabId !== tabId);
        });
    }

    navButtons.dashboard.addEventListener('click', (e) => { e.preventDefault(); showPage('dashboard-page'); });
    navButtons.simulation.addEventListener('click', (e) => { e.preventDefault(); showPage('simulation-page'); });
    navButtons.about.addEventListener('click', (e) => { e.preventDefault(); showPage('about-page'); });
    document.getElementById('nav-dashboard-logo').addEventListener('click', (e) => { e.preventDefault(); showPage('dashboard-page'); });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.id.split('-')[1];
            showTab(tabId);
        });
    });

    // --- INISIALISASI ---
    showPage('dashboard-page'); // Tampilkan Dashboard sebagai halaman utama
    showTab('vendor'); // Tab default di halaman simulasi
    initSimulation(API_URL); // Kirim URL API ke modul simulasi
    loadHistory(API_URL); // Muat riwayat file saat aplikasi dimulai
});