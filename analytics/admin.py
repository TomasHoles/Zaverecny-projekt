"""
admin.py - Admin konfigurace pro modul analytiky

@author Tomáš Holes
@description Modul analytics neobsahuje vlastní modely - veškerá data
    jsou počítána dynamicky z modelů jiných modulů (transactions, budgets, goals).
    
    Admin sekce pro analytická data tedy není potřeba.
"""
from django.contrib import admin

# Modul analytics nemá vlastní modely pro registraci
# Všechna data jsou agregována z jiných modulů
