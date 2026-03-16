const fs = require('fs');
const path = require('path');

// Pełna lista 168 brainrotów: GameRant (luty 2026) + ValuesRBX, PVPBank, wiki
const LIST = [
  {"name": "Noobini Cakenini", "rarity": "Common", "baseIncome": 2, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Lirili Larila", "rarity": "Common", "baseIncome": 4, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Tim Cheese", "rarity": "Common", "baseIncome": 6, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Frulli Frulla", "rarity": "Common", "baseIncome": 7, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Talpa Di Fero", "rarity": "Common", "baseIncome": 9, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Svinino Bombondino", "rarity": "Common", "baseIncome": 11, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Pipi Kiwi", "rarity": "Common", "baseIncome": 13, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Pipi Corni", "rarity": "Common", "baseIncome": 15, "tier": "F", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Trippi Troppi", "rarity": "Uncommon", "baseIncome": 20, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Gangster Footera", "rarity": "Uncommon", "baseIncome": 30, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Bobrito Bandito", "rarity": "Uncommon", "baseIncome": 35, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Boneca Ambalabu", "rarity": "Uncommon", "baseIncome": 40, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Cacto Hipopotamo", "rarity": "Uncommon", "baseIncome": 50, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Ta Ta Ta Sahur", "rarity": "Uncommon", "baseIncome": 60, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Tric Tric Baraboom", "rarity": "Uncommon", "baseIncome": 70, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "67", "rarity": "Uncommon", "baseIncome": 90, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Pipi Avocado", "rarity": "Uncommon", "baseIncome": 120, "tier": "D", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Cappuccino Assassino", "rarity": "Rare", "baseIncome": 100, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Trulimero Trulicina", "rarity": "Rare", "baseIncome": 135, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Bambini Crostini", "rarity": "Rare", "baseIncome": 150, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Bananita Dolphinita", "rarity": "Rare", "baseIncome": 170, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Brr Brr Patapim", "rarity": "Rare", "baseIncome": 180, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Perochello Lemonchello", "rarity": "Rare", "baseIncome": 190, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Avocadini Guffo", "rarity": "Rare", "baseIncome": 210, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Salamino Penguino", "rarity": "Rare", "baseIncome": 229, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Penguino Cocosino", "rarity": "Rare", "baseIncome": 250, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Ti Ti Ti Sahur", "rarity": "Rare", "baseIncome": 275, "tier": "C", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Burbaloni Luliloli", "rarity": "Epic", "baseIncome": 290, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Chimpanzini Bananini", "rarity": "Epic", "baseIncome": 475, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Ballerina Cappuccina", "rarity": "Epic", "baseIncome": 550, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Chef Crabracadabra", "rarity": "Epic", "baseIncome": 625, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Lionel Cactuseli", "rarity": "Epic", "baseIncome": 700, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Glorbo Fruttodrillo", "rarity": "Epic", "baseIncome": 775, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Strawberrelli Flamingelli", "rarity": "Epic", "baseIncome": 925, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Pandaccini Bananini", "rarity": "Epic", "baseIncome": 1000, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Sigma Boy", "rarity": "Epic", "baseIncome": 1100, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Pi Pi Watermelon", "rarity": "Epic", "baseIncome": 1200, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Blueberrinni Octopussini", "rarity": "Epic", "baseIncome": 1275, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Cocosini Mama", "rarity": "Epic", "baseIncome": 1300, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Guesto Angelic", "rarity": "Epic", "baseIncome": 1400, "tier": "B", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Frigo Camelo", "rarity": "Legendary", "baseIncome": 1500, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Orangutini Ananasini", "rarity": "Legendary", "baseIncome": 1700, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Rhino Toasterino", "rarity": "Legendary", "baseIncome": 1900, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Bombardiro Crocodilo", "rarity": "Legendary", "baseIncome": 2100, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Spioniro Golubiro", "rarity": "Legendary", "baseIncome": 2290, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Bombombini Gusini", "rarity": "Legendary", "baseIncome": 2600, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Zibra Zubra Zibralini", "rarity": "Legendary", "baseIncome": 2900, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Tigrilini Watermelini", "rarity": "Legendary", "baseIncome": 3200, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Cavallo Virtuoso", "rarity": "Legendary", "baseIncome": 3500, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Gorillo Watermelondrillo", "rarity": "Legendary", "baseIncome": 4000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Avocadorilla", "rarity": "Legendary", "baseIncome": 4500, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Eaglucci Cocosucci", "rarity": "Legendary", "baseIncome": 4700, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Ganganzelli Trulala", "rarity": "Legendary", "baseIncome": 5000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Cocofanto Elefanto", "rarity": "Mythical", "baseIncome": 6000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Giraffa Celeste", "rarity": "Mythical", "baseIncome": 7000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Tralalero Tralala", "rarity": "Mythical", "baseIncome": 8000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Los Crocodillitos", "rarity": "Mythical", "baseIncome": 9000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Tigroligre Frutonni", "rarity": "Mythical", "baseIncome": 10000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Udin Din Din Dun", "rarity": "Mythical", "baseIncome": 11000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Trenostruzzo Turbo 3000", "rarity": "Mythical", "baseIncome": 13000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Trippi Troppi Troppa Trippa", "rarity": "Mythical", "baseIncome": 15000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Orcalero Orcala", "rarity": "Mythical", "baseIncome": 18000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Piccione Macchina", "rarity": "Mythical", "baseIncome": 19000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Tukanno Bananno", "rarity": "Mythical", "baseIncome": 21000, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Ballerino Lololo", "rarity": "Mythical", "baseIncome": 25250, "tier": "A", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "La Vacca Saturno Saturnita", "rarity": "Cosmic", "baseIncome": 22000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Torrtuginni Dragonfrutini", "rarity": "Cosmic", "baseIncome": 30000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Los Tralaleritos", "rarity": "Cosmic", "baseIncome": 48000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Las Tralaleritas", "rarity": "Cosmic", "baseIncome": 50000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Las Vaquitas Saturnitas", "rarity": "Cosmic", "baseIncome": 60000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Graipuss Medussi", "rarity": "Cosmic", "baseIncome": 70000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Pot Hotspot", "rarity": "Cosmic", "baseIncome": 80000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Chicleteira Bicicleteira", "rarity": "Cosmic", "baseIncome": 90000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "La Grande Combinasion", "rarity": "Cosmic", "baseIncome": 100000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Nuclearo Dinossauro", "rarity": "Cosmic", "baseIncome": 110000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Garama and Madundung", "rarity": "Cosmic", "baseIncome": 120000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Dragon Cannelloni", "rarity": "Cosmic", "baseIncome": 130000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Agarrini la Palini", "rarity": "Cosmic", "baseIncome": 150000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Chimpanzini Spiderini", "rarity": "Cosmic", "baseIncome": 170000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Dariungini Pandanneli", "rarity": "Cosmic", "baseIncome": 190000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Vroosh Boosh", "rarity": "Cosmic", "baseIncome": 240000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Matteo", "rarity": "Secret", "baseIncome": 200000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Gattatino Neonino", "rarity": "Secret", "baseIncome": 250000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Statutino Libertino", "rarity": "Secret", "baseIncome": 300000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Unclito Samito", "rarity": "Secret", "baseIncome": 350000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Gattatino Donutino", "rarity": "Secret", "baseIncome": 400000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Espresso Signora", "rarity": "Secret", "baseIncome": 450000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Los Tungtungtungcitos", "rarity": "Secret", "baseIncome": 500000, "tier": "S", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Aura Farma", "rarity": "Secret", "baseIncome": 700000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Rainbow 67", "rarity": "Secret", "baseIncome": 800000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Fragola La La La", "rarity": "Secret", "baseIncome": 1000000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Eek Eek Eek Sahur", "rarity": "Secret", "baseIncome": 1050000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "La Vacca Black Hole Goat", "rarity": "Secret", "baseIncome": 1200000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Bambooini Bombini", "rarity": "Secret", "baseIncome": 1140000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Mastodontico Telepiedone", "rarity": "Secret", "baseIncome": 1420000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Tractoro Dinosauro", "rarity": "Secret", "baseIncome": 4650000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Capybara Monitora", "rarity": "Secret", "baseIncome": 5090000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Patatino Astronauta", "rarity": "Secret", "baseIncome": 5700000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Patito Dinerito", "rarity": "Secret", "baseIncome": 6000000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Onionello Penguini", "rarity": "Secret", "baseIncome": 6450000, "tier": "SS", "imageUrl": "", "mutationNote": "Emerald 1.2x / Diamond 2.5x (event)"},
  {"name": "Dug Dug Dug", "rarity": "Celestial", "baseIncome": 8000000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Alessio", "rarity": "Celestial", "baseIncome": 9000000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Esok Sekolah", "rarity": "Celestial", "baseIncome": 9500000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Bisonte Giuppitere", "rarity": "Celestial", "baseIncome": 8500000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Job Job Job Sahur", "rarity": "Celestial", "baseIncome": 7500000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Caffe Trinity", "rarity": "Celestial", "baseIncome": 2000000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "La Malita", "rarity": "Celestial", "baseIncome": 12000000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Diamantusa", "rarity": "Celestial", "baseIncome": 12250000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Avocadini Antilopini", "rarity": "Celestial", "baseIncome": 13000000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Los Orcaleritos", "rarity": "Celestial", "baseIncome": 14000000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Capuccino Policia", "rarity": "Celestial", "baseIncome": 14500000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Money Elephant", "rarity": "Celestial", "baseIncome": 14750000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Zung Zung Zung Lazur", "rarity": "Celestial", "baseIncome": 14750000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Rattini Machini", "rarity": "Celestial", "baseIncome": 15250000, "tier": "God", "imageUrl": "", "mutationNote": "Diamond 2.5x / Electric 3x (event)"},
  {"name": "Bulbito Bandito Traktorito", "rarity": "Divine", "baseIncome": 30000000, "tier": "God", "imageUrl": "", "mutationNote": "Electric 3x / Doom (admin event)"},
  {"name": "Burgerini Bearini", "rarity": "Divine", "baseIncome": 35000000, "tier": "God", "imageUrl": "", "mutationNote": "Electric 3x / Doom (admin event)"},
  {"name": "Martino Gravitino", "rarity": "Divine", "baseIncome": 45000000, "tier": "God", "imageUrl": "", "mutationNote": "Electric 3x / Doom (admin event)"},
  {"name": "Grappellino D'Oro", "rarity": "Divine", "baseIncome": 48500000, "tier": "God", "imageUrl": "", "mutationNote": "Electric 3x / Doom (admin event)"},
  {"name": "Galactio Fantasma", "rarity": "Divine", "baseIncome": 88800000, "tier": "God", "imageUrl": "", "mutationNote": "Electric 3x / Doom (admin event)"},
  {"name": "Strawberry Elephant", "rarity": "Divine", "baseIncome": 50000000, "tier": "God", "imageUrl": "", "mutationNote": "Electric 3x / Doom (admin event)"},
  {"name": "Noobini Infeeny", "rarity": "Infinity", "baseIncome": 375000000, "tier": "God", "imageUrl": "", "mutationNote": "Lucky + Electric 3x (blender locked)"},
  {"name": "Anububu", "rarity": "Infinity", "baseIncome": 250000000, "tier": "God", "imageUrl": "", "mutationNote": "Lucky + Electric 3x (blender locked)"},
  {"name": "Meta Technetta", "rarity": "Infinity", "baseIncome": 300000000, "tier": "God", "imageUrl": "", "mutationNote": "Lucky + Electric 3x (blender locked)"},
  {"name": "Magmew", "rarity": "Infinity", "baseIncome": 400000000, "tier": "God", "imageUrl": "", "mutationNote": "Lucky + Electric 3x (blender locked)"}
];

function toId(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const items = LIST
  .map(b => ({
    id: toId(b.name),
    name: b.name,
    rarity: b.rarity,
    category: b.rarity,
    baseIncome: b.baseIncome,
    income: b.baseIncome,
    tier: b.tier,
    mutationNote: b.mutationNote,
    imageUrl: b.imageUrl ?? ''
  }))
  .sort((a, b) => a.baseIncome - b.baseIncome);

const out = {
  meta: {
    lastUpdated: "2026-03-13",
    sources: [
      "gamerant.com/roblox-escape-tsunami-for-brainrots-all-brainrots-list-values (luty 2026)",
      "ValuesRBX",
      "PVPBank",
      "escapetsunamiforbrainrotswiki.com"
    ],
    totalItems: items.length,
    tiers: "F → D → C → B → A → S → SS → God",
    mutations: "Lucky (event only); level do 300 mnoży $/s"
  },
  items
};

const OUT_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
console.log('✅ Zapisano', items.length, 'brainrotów do', OUT_PATH);
