/**
 * Maps brainrots to Beebom image URLs
 * Source: https://beebom.com/all-brainrots-in-escape-tsunami-for-brainrots/
 * Run: node scripts/fetch-beebom-images.js
 */

const fs = require('fs');
const path = require('path');

const BRAINROTS_PATH = path.join(__dirname, '..', 'data', 'brainrots.json');
const MAPPING_PATH = path.join(__dirname, '..', 'data', 'image-mapping.json');
const BEEBOM_BASE = 'https://static.beebom.com/wp-content/uploads/2026/01';

// Beebom uses specific filenames - map our id to their filename
const BEEBOM_FILENAMES = {
  '67': '67.jpg',
  'alessio': 'Alessio.jpg',
  'aura-farma': 'Aura-Farma.jpg',
  'avocadini-antilopini': 'Avocadini-Antilopini.jpg',
  'avocadorilla': 'Avocadorilla.jpg',
  'avocadini-guffo': 'Avocadini-Guffo.jpg',
  'ballerino-lololo': 'Ballerino-Lololo.jpg',
  'ballerina-cappuccina': 'Ballerina-Cappuccina.jpg',
  'bananita-dolphinita': 'Bananita-Dolphinita.jpg',
  'bambini-crostini': 'Bambini-Crostini.jpg',
  'bisonte-gupitere': 'Bisonte-Gupitere.jpg',
  'bombardilo-crocodilo': 'Bombardilo-Crocodilo.jpg',
  'bombombini-gusini': 'Bombombini-Gusini.jpg',
  'boneca-ambalabu': 'Boneca-Ambalabu.jpg',
  'bobrito-bandito': 'Bobrito-Bandito.jpg',
  'brr-brr-patapim': 'Brr-Brr-Patapim.jpg',
  'burbaloni-luliloli': 'Burbaloni-Luliloli.jpg',
  'bulbito-bandito-traktorito': 'Bulbito-Bandito-Traktorito.jpg',
  'cacto-hipopotamo': 'Cacto-Hipopotamo.jpg',
  'cappuccino-assassino': 'Cappuccino-Assassino.jpg',
  'capuccino-policia': 'Cappuccino-Policia.jpg',
  'cavallo-virtuoso': 'Cavallo-Virtuoso.jpg',
  'chef-crabracadabra': 'Chef-Crabracadabra.jpg',
  'chicleteira-bicicleteira': 'Chicleteira-Bicicleteira.jpg',
  'chimpanzini-bananini': 'Chimpanzini-Bananini.jpg',
  'chimpanzini-spiderini': 'Chimpanzini-Spiderini.jpg',
  'cioccolatone-draghettone': 'Cioccolatone-Draghettone.jpg',
  'cocofanto-elefanto': 'Cocofanto-Elefanto.jpg',
  'cocosini-mama': 'Cocosini-Mama.jpg',
  'dragon-cannelloni': 'Dragon-Cannelloni.jpg',
  'dug-dug-dug': 'Dug-Dug-Dug.jpg',
  'esok-sekolah': 'Esok-Sekolah.jpg',
  'espresso-signora': 'Espresso-Signora.jpg',
  'fragola-la-la-la': 'Fragola-La-La-La.jpg',
  'frigo-camelo': 'Frigo-Camelo.jpg',
  'frulli-frulla': 'Frulli-Frulla.jpg',
  'ganganzelli-trulala': 'Ganganzelli-Trulala.jpg',
  'gangster-footera': 'Gangster-Footera.jpg',
  'garama-madundung': 'Garama-and-Madundung.jpg',
  'gattatino-nyanino': 'Gattatino-Nyanino.jpg',
  'gattatino-neonino': 'Gattatino-Neonino.jpg',
  'giraffa-celeste': 'Giraffa-Celeste.jpg',
  'glorbo-fruttodrillo': 'Glorbo-Fruttodrillo.jpg',
  'gorillo-watermelondrillo': 'Gorillo-Watermelondrillo.jpg',
  'graipuss-medussi': 'Graipuss-Medussi.jpg',
  'guesto-angelic': 'Guesto-Angelic.jpg',
  'agarrini-la-palini': 'Agarrini-la-Palini.jpg',
  'la-grande-combinasion': 'La-Grande-Combinasion.jpg',
  'la-malita': 'La-Malita.jpg',
  'la-vacca-saturno-saturnita': 'La-Vacca-Saturno-Saturnita.jpg',
  'las-tralaleritas': 'Las-Tralaleritas.jpg',
  'las-vaquitas-saturnitas': 'Las-Vaquitas-Saturnitas.jpg',
  'lionel-cactuseli': 'Lionel-Cactuseli.jpg',
  'lirili-larila': 'Lirili-Larila.jpg',
  'los-crocodillitos': 'Los-Crocodillitos.jpg',
  'los-orcaleritos': 'Los-Orcaleritos.jpg',
  'los-tralaleritos': 'Los-Tralaleritos.jpg',
  'los-tungtungtungcitos': 'Los-Tungtungtungcitos.jpg',
  'matteo': 'Matteo.jpg',
  'money-elephant': 'Money-Elephant.jpg',
  'nuclearo-dinossauro': 'Nuclearo-Dinossauro.jpg',
  'noobini-cakenini': 'Noobini-Cakenini.jpg',
  'onionello-penguini': 'Onionello-Penguini.jpg',
  'orangutini-ananassini': 'Orangutini-Ananassini.jpg',
  'orcalero-orcala': 'Orcalero-Orcala.jpg',
  'patito-dinerito': 'Patito-Dinerito.jpg',
  'patatino-astronauta': 'Patatino-Astronauta.jpg',
  'pandaccini-bananini': 'Pandaccini-Bananini.jpg',
  'penguino-cocosino': 'Penguino-Cocosino.jpg',
  'perochello-lemonchello': 'Perochello-Lemonchello.jpg',
  'pi-pi-watermelon': 'Pi-Pi-Watermelon.jpg',
  'piccione-macchina': 'Piccione-Macchina.jpg',
  'pipi-avocado': 'Pipi-Avocado.jpg',
  'pipi-corni': 'Pipi-Corni.jpg',
  'pipi-kiwi': 'Pipi-Kiwi.jpg',
  'polpo-semaforini': 'Polpo-Semaforini.jpg',
  'pot-hotspot': 'Pot-Hotspot.jpg',
  'rainbow-67': 'Rainbow-67.jpg',
  'rhino-toasterino': 'Rhino-Toasterino.jpg',
  'rattini-machini': 'Rattini-Machini.jpg',
  'salamino-penguino': 'Salamino-Penguino.jpg',
  'sigma-boy': 'Sigma-Boy.jpg',
  'spioniro-golubiro': 'Spioniro-Golubiro.jpg',
  'statutino-libertino': 'Statutino-Libertino.jpg',
  'strawberry-elephant': 'Strawberry-Elephant.jpg',
  'strawberrilli-flamengilli': 'Strawberrilli-Flamengilli.jpg',
  'svinino-bombondino': 'Svinino-Bombondino.jpg',
  'ta-ta-ta-sahur': 'Ta-Ta-Ta-Sahur.jpg',
  'talpa-di-fero': 'Talpa-Di-Fero.jpg',
  'tartarughi-attrezzini': 'Tartarughi-Attrezzini.jpg',
  'ti-ti-ti-sahur': 'Ti-Ti-Ti-Sahur.jpg',
  'tigrilini-watermelini': 'Tigrilini-Watermelini.jpg',
  'tigroligre-frutonni': 'Tigroligre-Frutonni.jpg',
  'tim-cheese': 'Tim-Cheese.jpg',
  'torrtuginni-dragonfrutini': 'Torrtuginni-Dragonfrutini.jpg',
  'tractoro-dinosauro': 'Tractoro-Dinosauro.jpg',
  'tralalero-tralala': 'Tralalero-Tralala.jpg',
  'trenostruzzo-turbo-3000': 'Trenostruzzo-Turbo-3000.jpg',
  'tric-tric-baraboom': 'Tric-Tric-Baraboom.jpg',
  'trippi-troppi-troppa-trippa': 'Trippi-Troppi-Troppa-Trippa.jpg',
  'trippi-troppi': 'Trippi-Troppi.jpg',
  'trulimero-trulicina': 'Trulimero-Trulicina.jpg',
  'tukanno-bananno': 'Tukanno-Bananno.jpg',
  'udin-din-din-dun': 'Udin-Din-Din-Dun.jpg',
  'unclito-samito': 'Uncle-Sam.jpg',
  'zibra-zubra-zibralini': 'Zibra-Zubra-Zibralini.jpg',
  'zung-zung-zung-lazur': 'Zung-Zung-Zung-Lazur.jpg',
  'diamantusa': 'Diamantusa.jpg',
  'kissarini-heartini': 'Kissarini-Heartini.jpg',
  'capybara-monitora': 'Capybara-Monitora.jpg',
  'grappellino-doro': "Grappellino-D'Oro.jpg",
  'martino-gravitino': 'Martino-Gravitino.jpg',
  'burgerini-bearini': 'Burgerini-Bearini.jpg',
  'din-din-vaultero': 'Din-Din-Vaultero.jpg',
  'job-job-sahur': 'Job-Job-Sahur.jpg',
  'blueberrinni-octopussini': 'Blueberrinni-Octopussini.jpg',
  'meta-technetta': 'Meta-Technetta.jpg',
  'anububu': 'Anububu.jpg',
  'noobini-infeeny': 'Noobini-Infeeny.jpg',
  'cupitron-consoletron': 'Cupitron-Consoletron.jpg',
  'freezeti-cobretti': 'Freezeti-Cobretti.jpg',
  'rubichetto-cubini': 'Rubichetto-Cubini.jpg',
  'galactio-fantasma': 'Galactio-Fantasma.jpg',
  'biscotti-macarotti': 'Biscotti-Macarotti.jpg',
  'glacierello-inferniti': 'Glacierello-Inferniti.jpg',
};

// Items not on Beebom - keep placeholder or try name-based URL
function nameToBeebomFile(name) {
  return name.replace(/\s+/g, '-').replace(/'/g, '') + '.jpg';
}

async function main() {
  const brainrots = JSON.parse(fs.readFileSync(BRAINROTS_PATH, 'utf8'));
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  } catch {}
  const mapping = data.mapping || {};

  for (const item of brainrots.items) {
    const filename = BEEBOM_FILENAMES[item.id];
    if (filename) {
      mapping[item.id] = `${BEEBOM_BASE}/${filename}?w=150`;
    } else {
      const fallback = `${BEEBOM_BASE}/${nameToBeebomFile(item.name)}?w=150`;
      mapping[item.id] = fallback;
    }
  }

  data.mapping = mapping;
  data._source = 'beebom.com';
  data._sources_images = ['https://beebom.com/all-brainrots-in-escape-tsunami-for-brainrots/'];
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(data, null, 2));
  console.log(`Updated ${Object.keys(mapping).length} image URLs from Beebom`);
}

main().catch(console.error);
