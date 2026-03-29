export interface SeedMealIngredient {
  name: string;
  quantity: string;
  unit?: string;
}

export interface SeedMeal {
  name: string;
  description?: string;
  ingredients: SeedMealIngredient[];
  tags: string[];
}

export const mealCatalog: SeedMeal[] = [
  {
    name: 'Poulet rôti aux herbes',
    description: 'Un grand classique du dimanche, doré et parfumé.',
    tags: ['viande', 'four', 'classique'],
    ingredients: [
      { name: 'Poulet entier', quantity: '1', unit: 'pièce' },
      { name: 'Ail', quantity: '4', unit: 'gousses' },
      { name: 'Thym', quantity: '3', unit: 'branches' },
      { name: 'Romarin', quantity: '2', unit: 'branches' },
      { name: 'Citron', quantity: '1', unit: 'pièce' },
      { name: "Huile d'olive", quantity: '3', unit: 'c. à soupe' },
      { name: 'Beurre', quantity: '30', unit: 'g' },
      { name: 'Sel et poivre', quantity: 'QS' },
    ],
  },
  {
    name: 'Bœuf bourguignon',
    description: 'Mijoté au vin rouge, fondant et savoureux.',
    tags: ['viande', 'mijoté', 'classique'],
    ingredients: [
      { name: 'Bœuf à braiser', quantity: '1', unit: 'kg' },
      { name: 'Vin rouge', quantity: '75', unit: 'cl' },
      { name: 'Carottes', quantity: '3', unit: 'pièces' },
      { name: 'Oignons', quantity: '2', unit: 'pièces' },
      { name: 'Champignons de Paris', quantity: '250', unit: 'g' },
      { name: 'Lardons', quantity: '150', unit: 'g' },
      { name: 'Ail', quantity: '3', unit: 'gousses' },
      { name: 'Bouquet garni', quantity: '1', unit: 'pièce' },
      { name: 'Farine', quantity: '2', unit: 'c. à soupe' },
      { name: 'Huile', quantity: '2', unit: 'c. à soupe' },
    ],
  },
  {
    name: 'Gratin dauphinois',
    description: 'Pommes de terre fondantes à la crème et à l\'ail.',
    tags: ['légume', 'four', 'classique'],
    ingredients: [
      { name: 'Pommes de terre', quantity: '1', unit: 'kg' },
      { name: 'Crème fraîche épaisse', quantity: '40', unit: 'cl' },
      { name: 'Lait', quantity: '20', unit: 'cl' },
      { name: 'Ail', quantity: '2', unit: 'gousses' },
      { name: 'Gruyère râpé', quantity: '100', unit: 'g' },
      { name: 'Beurre', quantity: '20', unit: 'g' },
      { name: 'Noix de muscade', quantity: 'QS' },
      { name: 'Sel et poivre', quantity: 'QS' },
    ],
  },
  {
    name: 'Quiche lorraine',
    description: 'Tarte salée aux lardons et à la crème, parfaite le midi.',
    tags: ['tarte', 'four', 'classique'],
    ingredients: [
      { name: 'Pâte brisée', quantity: '1', unit: 'rouleau' },
      { name: 'Lardons fumés', quantity: '200', unit: 'g' },
      { name: 'Œufs', quantity: '3', unit: 'pièces' },
      { name: 'Crème fraîche', quantity: '20', unit: 'cl' },
      { name: 'Lait', quantity: '10', unit: 'cl' },
      { name: 'Gruyère râpé', quantity: '80', unit: 'g' },
      { name: 'Sel et poivre', quantity: 'QS' },
      { name: 'Noix de muscade', quantity: 'QS' },
    ],
  },
  {
    name: 'Ratatouille',
    description: 'Légumes du soleil mijotés à la provençale.',
    tags: ['légume', 'végétarien', 'mijoté'],
    ingredients: [
      { name: 'Aubergines', quantity: '2', unit: 'pièces' },
      { name: 'Courgettes', quantity: '2', unit: 'pièces' },
      { name: 'Poivrons rouges', quantity: '2', unit: 'pièces' },
      { name: 'Tomates', quantity: '4', unit: 'pièces' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Ail', quantity: '3', unit: 'gousses' },
      { name: "Huile d'olive", quantity: '4', unit: 'c. à soupe' },
      { name: 'Thym, basilic', quantity: 'QS' },
    ],
  },
  {
    name: 'Lasagnes bolognaise',
    description: 'Couches de pâtes, bolognaise et béchamel gratinées au four.',
    tags: ['pâtes', 'four', 'famille'],
    ingredients: [
      { name: 'Feuilles de lasagnes', quantity: '12', unit: 'pièces' },
      { name: 'Bœuf haché', quantity: '500', unit: 'g' },
      { name: 'Coulis de tomates', quantity: '70', unit: 'cl' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Ail', quantity: '2', unit: 'gousses' },
      { name: 'Lait', quantity: '50', unit: 'cl' },
      { name: 'Farine', quantity: '40', unit: 'g' },
      { name: 'Beurre', quantity: '40', unit: 'g' },
      { name: 'Emmental râpé', quantity: '150', unit: 'g' },
      { name: 'Sel, poivre, muscade', quantity: 'QS' },
    ],
  },
  {
    name: 'Spaghetti carbonara',
    description: 'La vraie carbonara à la romaine, sans crème.',
    tags: ['pâtes', 'rapide'],
    ingredients: [
      { name: 'Spaghetti', quantity: '400', unit: 'g' },
      { name: 'Guanciale ou lardons', quantity: '200', unit: 'g' },
      { name: 'Œufs entiers', quantity: '2', unit: 'pièces' },
      { name: 'Jaunes d\'œufs', quantity: '3', unit: 'pièces' },
      { name: 'Pecorino ou parmesan', quantity: '100', unit: 'g' },
      { name: 'Poivre noir', quantity: 'QS' },
      { name: 'Sel', quantity: 'QS' },
    ],
  },
  {
    name: 'Risotto aux champignons',
    description: 'Crémeux et parfumé, un plat qui réchauffe.',
    tags: ['riz', 'végétarien', 'crémeux'],
    ingredients: [
      { name: 'Riz arborio', quantity: '300', unit: 'g' },
      { name: 'Champignons de Paris', quantity: '300', unit: 'g' },
      { name: 'Champignons secs', quantity: '30', unit: 'g' },
      { name: 'Bouillon de légumes', quantity: '1', unit: 'L' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Vin blanc sec', quantity: '15', unit: 'cl' },
      { name: 'Parmesan', quantity: '80', unit: 'g' },
      { name: 'Beurre', quantity: '40', unit: 'g' },
      { name: "Huile d'olive", quantity: '2', unit: 'c. à soupe' },
    ],
  },
  {
    name: 'Soupe à l\'oignon gratinée',
    description: 'Soupe chaude et réconfortante avec son chapeau de fromage fondu.',
    tags: ['soupe', 'classique', 'hiver'],
    ingredients: [
      { name: 'Oignons', quantity: '1', unit: 'kg' },
      { name: 'Beurre', quantity: '50', unit: 'g' },
      { name: 'Farine', quantity: '2', unit: 'c. à soupe' },
      { name: 'Bouillon de bœuf', quantity: '1.5', unit: 'L' },
      { name: 'Vin blanc', quantity: '10', unit: 'cl' },
      { name: 'Pain rassis', quantity: '4', unit: 'tranches' },
      { name: 'Gruyère râpé', quantity: '200', unit: 'g' },
      { name: 'Sel et poivre', quantity: 'QS' },
    ],
  },
  {
    name: 'Blanquette de veau',
    description: 'Veau tendre dans une sauce blanche crémeuse.',
    tags: ['viande', 'mijoté', 'classique'],
    ingredients: [
      { name: 'Veau (épaule ou tendron)', quantity: '1', unit: 'kg' },
      { name: 'Carottes', quantity: '3', unit: 'pièces' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Champignons de Paris', quantity: '200', unit: 'g' },
      { name: 'Crème fraîche', quantity: '20', unit: 'cl' },
      { name: 'Beurre', quantity: '40', unit: 'g' },
      { name: 'Farine', quantity: '3', unit: 'c. à soupe' },
      { name: 'Bouquet garni', quantity: '1', unit: 'pièce' },
      { name: 'Citron', quantity: '1', unit: 'pièce' },
    ],
  },
  {
    name: 'Poisson en papillote',
    description: 'Filets de poisson cuits à la vapeur avec légumes et herbes.',
    tags: ['poisson', 'léger', 'four'],
    ingredients: [
      { name: 'Filets de saumon ou cabillaud', quantity: '4', unit: 'pièces' },
      { name: 'Courgette', quantity: '1', unit: 'pièce' },
      { name: 'Tomates cerises', quantity: '150', unit: 'g' },
      { name: 'Citron', quantity: '2', unit: 'pièces' },
      { name: 'Aneth ou persil', quantity: 'QS' },
      { name: "Huile d'olive", quantity: '2', unit: 'c. à soupe' },
      { name: 'Sel et poivre', quantity: 'QS' },
    ],
  },
  {
    name: 'Curry de poulet',
    description: 'Poulet mijoté dans une sauce curry au lait de coco.',
    tags: ['poulet', 'épicé', 'exotique'],
    ingredients: [
      { name: 'Blancs de poulet', quantity: '600', unit: 'g' },
      { name: 'Lait de coco', quantity: '40', unit: 'cl' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Ail', quantity: '3', unit: 'gousses' },
      { name: 'Gingembre frais', quantity: '2', unit: 'cm' },
      { name: 'Pâte de curry', quantity: '2', unit: 'c. à soupe' },
      { name: 'Tomates pelées', quantity: '400', unit: 'g' },
      { name: 'Riz basmati', quantity: '300', unit: 'g' },
      { name: "Huile d'olive", quantity: '2', unit: 'c. à soupe' },
    ],
  },
  {
    name: 'Tarte flambée alsacienne',
    description: 'Fine pâte garnie de crème fraîche, oignons et lardons.',
    tags: ['tarte', 'four', 'alsace'],
    ingredients: [
      { name: 'Pâte fine à pizza', quantity: '1', unit: 'rouleau' },
      { name: 'Crème fraîche épaisse', quantity: '200', unit: 'g' },
      { name: 'Oignons', quantity: '2', unit: 'pièces' },
      { name: 'Lardons fumés', quantity: '150', unit: 'g' },
      { name: 'Sel, poivre, muscade', quantity: 'QS' },
    ],
  },
  {
    name: 'Hachis parmentier',
    description: 'Viande hachée gratinée sous une purée dorée.',
    tags: ['viande', 'four', 'classique', 'famille'],
    ingredients: [
      { name: 'Bœuf haché', quantity: '500', unit: 'g' },
      { name: 'Pommes de terre', quantity: '800', unit: 'g' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Coulis de tomates', quantity: '20', unit: 'cl' },
      { name: 'Beurre', quantity: '50', unit: 'g' },
      { name: 'Lait', quantity: '10', unit: 'cl' },
      { name: 'Gruyère râpé', quantity: '80', unit: 'g' },
      { name: 'Thym, laurier', quantity: 'QS' },
    ],
  },
  {
    name: 'Salade niçoise',
    description: 'Salade fraîche au thon, œufs, olives et légumes croquants.',
    tags: ['salade', 'léger', 'été'],
    ingredients: [
      { name: 'Thon en boîte', quantity: '2', unit: 'boîtes' },
      { name: 'Haricots verts', quantity: '200', unit: 'g' },
      { name: 'Tomates', quantity: '3', unit: 'pièces' },
      { name: 'Œufs durs', quantity: '4', unit: 'pièces' },
      { name: 'Olives noires', quantity: '100', unit: 'g' },
      { name: 'Anchois', quantity: '8', unit: 'filets' },
      { name: 'Salade verte', quantity: '1', unit: 'pièce' },
      { name: 'Vinaigrette', quantity: 'QS' },
    ],
  },
  {
    name: 'Taboulé libanais',
    description: 'Herbes fraîches, boulgour et citron, rafraîchissant.',
    tags: ['salade', 'végétarien', 'été', 'rapide'],
    ingredients: [
      { name: 'Boulgour fin', quantity: '200', unit: 'g' },
      { name: 'Persil plat', quantity: '2', unit: 'bottes' },
      { name: 'Menthe fraîche', quantity: '1', unit: 'botte' },
      { name: 'Tomates', quantity: '3', unit: 'pièces' },
      { name: 'Oignons verts', quantity: '3', unit: 'tiges' },
      { name: 'Jus de citron', quantity: '4', unit: 'c. à soupe' },
      { name: "Huile d'olive", quantity: '4', unit: 'c. à soupe' },
      { name: 'Sel et poivre', quantity: 'QS' },
    ],
  },
  {
    name: 'Pizza margherita maison',
    description: 'Pâte maison, sauce tomate et mozzarella.',
    tags: ['four', 'famille', 'italien'],
    ingredients: [
      { name: 'Farine T45', quantity: '300', unit: 'g' },
      { name: 'Levure de boulanger', quantity: '7', unit: 'g' },
      { name: 'Eau tiède', quantity: '18', unit: 'cl' },
      { name: 'Coulis de tomates', quantity: '200', unit: 'g' },
      { name: 'Mozzarella', quantity: '250', unit: 'g' },
      { name: 'Basilic frais', quantity: 'QS' },
      { name: "Huile d'olive", quantity: '2', unit: 'c. à soupe' },
      { name: 'Sel', quantity: 'QS' },
    ],
  },
  {
    name: 'Wok de poulet et légumes',
    description: 'Sauté rapide et coloré à la sauce soja.',
    tags: ['poulet', 'rapide', 'asiatique'],
    ingredients: [
      { name: 'Blancs de poulet', quantity: '400', unit: 'g' },
      { name: 'Poivrons', quantity: '2', unit: 'pièces' },
      { name: 'Carottes', quantity: '2', unit: 'pièces' },
      { name: 'Brocoli', quantity: '200', unit: 'g' },
      { name: 'Sauce soja', quantity: '4', unit: 'c. à soupe' },
      { name: 'Sauce huître', quantity: '2', unit: 'c. à soupe' },
      { name: 'Ail', quantity: '2', unit: 'gousses' },
      { name: 'Gingembre', quantity: '1', unit: 'cm' },
      { name: "Huile de sésame", quantity: '1', unit: 'c. à soupe' },
      { name: 'Riz', quantity: '300', unit: 'g' },
    ],
  },
  {
    name: 'Omelette aux champignons',
    description: 'Omelette baveuse garnie de champignons sautés.',
    tags: ['œuf', 'rapide', 'végétarien'],
    ingredients: [
      { name: 'Œufs', quantity: '6', unit: 'pièces' },
      { name: 'Champignons de Paris', quantity: '250', unit: 'g' },
      { name: 'Ail', quantity: '1', unit: 'gousse' },
      { name: 'Persil', quantity: 'QS' },
      { name: 'Beurre', quantity: '20', unit: 'g' },
      { name: 'Sel et poivre', quantity: 'QS' },
    ],
  },
  {
    name: 'Croque-monsieur au four',
    description: 'Sandwich chaud jambon-fromage gratiné à la béchamel.',
    tags: ['rapide', 'famille', 'four'],
    ingredients: [
      { name: 'Pain de mie', quantity: '8', unit: 'tranches' },
      { name: 'Jambon blanc', quantity: '4', unit: 'tranches' },
      { name: 'Gruyère râpé', quantity: '150', unit: 'g' },
      { name: 'Beurre', quantity: '30', unit: 'g' },
      { name: 'Farine', quantity: '20', unit: 'g' },
      { name: 'Lait', quantity: '25', unit: 'cl' },
      { name: 'Moutarde', quantity: '1', unit: 'c. à café' },
    ],
  },
];

export function searchCatalog(query: string): SeedMeal[] {
  if (!query || query.trim().length === 0) return mealCatalog;
  const q = query.trim().toLowerCase();
  return mealCatalog.filter(
    (meal) =>
      meal.name.toLowerCase().includes(q) ||
      meal.tags.some((t) => t.includes(q)) ||
      meal.ingredients.some((i) => i.name.toLowerCase().includes(q)),
  );
}
