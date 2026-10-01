let DB={cards:[]}, META={cards:{}}, CATALOG={cards:[]}, OVERLAP={conflicts:[]}, filter='all', query='', sortMode='box', selectedTeam=[], verifyLimit=30, inventory={}, inventoryFilter='review', inventoryQuery='', missingQuery='', rarityFilter='', typeFilter='', classFilter='', categoryFilter='', linkFilter='', ezaFilter='', favoriteOnly=false, favorites=new Set(), rainbow100=new Set(), potentialManual={}, teamLeader='';
const norm=s=>(s??'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let storageWarningShown=false;
function storageWrite(key,value){try{localStorage.setItem(key,value);return true}catch(e){if(!storageWarningShown){storageWarningShown=true;alert('La sauvegarde locale est indisponible. Les changements de cette session ne seront pas conservés.')}return false}}
function storageRead(key){try{return localStorage.getItem(key)}catch(e){return null}}
function storedJSON(key,fallback){try{return JSON.parse(storageRead(key)||JSON.stringify(fallback))}catch(e){return fallback}}
const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
function assignIdentification(c,id){const candidate=verifyCandidate(id);if(!candidate||!isPlayableCard(candidate))return false;
 const fields=new Set(['name','title','rarity','type','class','categories','links','leader','passive','passiveName','superAttack','ultraSuperAttack','active','activeName','transformations','eza','fr','source','sources','teamRules','maxHP','maxATK','maxDEF','rainbowHP','rainbowATK','rainbowDEF','cost','maxLevel','maxSALevel',...Object.keys(META.cards?.[String(c.candidateId)]||{}),...Object.keys(META.cards?.[String(id)]||{})]);
 for(const key of fields)if(!['boxId','candidateId','validated','confidence','capture','position','crop','_edited'].includes(key))delete c[key];
 Object.assign(c,candidate);c.candidateId=String(id);return true;
}
const FR_TERMS={
'Movie Bosses':'Boss des films','Wicked Bloodline':'Lignée diabolique','Resurrected Warriors':'Ressuscité','Giant Form':'Forme géante','Artificial Life Forms':'Forme de vie artificielle','Terrifying Conquerors':'Terrifiants conquérants','Target: Goku':'Objectif Son Goku','Corroded Body and Mind':'Corps et esprit corrompus','Gifted Warriors':'Guerriers de génie','Otherworld Warriors':"Combattants de l’au-delà",'Transformation Boost':'Transformation fortifiante','Power Absorption':'Absorption de puissance','Revenge':'Vengeance','Planetary Destruction':'Destruction planétaire','Accelerated Battle':'Combat accéléré','Battle of Fate':'Combat du destin','Final Trump Card':'Dernier recours','Joined Forces':'Forces jointes','Pure Saiyans':'Saiyan pur','Hybrid Saiyans':'Saiyan de sang-mêlé','Realm of Gods':'Puissance divine','Majin Buu Saga':'Saga de Boo','Future Saga':'Saga du futur','Androids':'Cyborge','Androids/Cell Saga':'Saga des cyborgs/Cell','Full Power':'Pleine puissance','Time Travelers':'Voyageur du temps','Kamehameha':'Kamehameha','Bond of Parent and Child':'Lien parent-enfant','Bond of Friendship':"Lien d’amitié",'Earth-Bred Fighters':'Combattants élevés sur Terre','Power Beyond Super Saiyan':'Pouvoir au-delà du Super Saiyan','Super Heroes':'Super héros','Movie Heroes':'Héros des films','Fusion':'Fusion','Fused Fighters':'Combattants fusionnés','Legendary Power':'Pouvoir légendaire','Big Bad Bosses':'Boss','Thirst for Conquest':'Ambition de conquête','Strongest Clan in Space':'Le plus puissant peuple','Auto Regeneration':'Auto-régénération','Nightmare':'Cauchemar','Fear and Faith':'Peur et désespoir','Shocking Speed':'Vitesse époustouflante','Brutal Beatdown':'Boost de handicap','Metamorphosis':'Métamorphose','Fierce Battle':'Combat acharné','Shattering the Limit':'Briser la limite','Prepared for Battle':'Préparé au combat','Super Saiyan':'Super Saiyan','Golden Warrior':'Guerrier doré','Royal Lineage':'Lignée royale','Saiyan Warrior Race':'Race guerrière Saiyan','Prodigies':'Prodiges','Cold Judgment':'Jugement froid','Brainiacs':'Cerveau','Infighter':'Combattant aguerri','Over in a Flash':'Vitesse éclair','Tournament of Power':'Tournoi du pouvoir','Godly Power':'Pouvoir divin','Warrior Gods':'Dieux guerriers','Kamehameha':'Kamehameha'
};
FR_TERMS["DB Saga"]="Arc enfant";
FR_TERMS["Planet Namek Saga"]="Saga de Namek";
FR_TERMS["Universe Survival Saga"]="Survie de l’Univers";
FR_TERMS["Shadow Dragon Saga"]="Dragon maléfique";
FR_TERMS["Miraculous Awakening"]="Éveil miraculeux";
FR_TERMS["Powerful Comeback"]="Puissance restaurée";
FR_TERMS["World Tournament"]="Tenkaichi Budokai";
FR_TERMS["Ginyu Force"]="Commando Ginyu";
FR_TERMS["Rapid Growth"]="Croissance rapide";
FR_TERMS["Saviors"]="Sauveur";
FR_TERMS["Universe 6"]="Univers 6";
FR_TERMS["Representatives of Universe 7"]="Représentants de l’Univers 7";
FR_TERMS["Majin Power"]="Pouvoir de Majin";
FR_TERMS["Potara"]="Potalas";
FR_TERMS["Dragon Ball Seekers"]="Chercheurs de boules de cristal";
FR_TERMS["Heavenly Events"]="Péripéties célestes";
FR_TERMS["Battle of Wits"]="Combat plein d’astuces";
FR_TERMS["Earthlings"]="Terrien";
FR_TERMS["Special Pose"]="Pose spéciale";
FR_TERMS["Space-Traveling Warriors"]="Guerriers galactiques";
FR_TERMS["Defenders of Justice"]="Défenseurs de la justice";
FR_TERMS["Connected Hope"]="Aspirations connectées";
FR_TERMS["Entrusted Will"]="Volonté confiée";
FR_TERMS["Fused Fighters"]="Combattants fusionnés";
FR_TERMS["Worldwide Chaos"]="Chaos mondial";
FR_TERMS["Power of Wishes"]="Le pouvoir des vœux";
FR_TERMS["Super Heroes"]="Super héros";
FR_TERMS["Movie Heroes"]="Héros des films";
FR_TERMS["Energy Absorption"]="Absorbeur d'énergie";
FR_TERMS["Big Bad Bosses"]="Boss";
FR_TERMS["Nightmare"]="Cauchemar";
FR_TERMS["Thirst for Conquest"]="Ambition de conquête";
FR_TERMS["Metamorphosis"]="Métamorphose";
FR_TERMS["Fierce Battle"]="Combat acharné";
FR_TERMS["Shattering the Limit"]="Briser la limite";
FR_TERMS["Prepared for Battle"]="Paré au combat";
FR_TERMS["Prodigies"]="Génie";
FR_TERMS["Cold Judgment"]="Jugement serein";
FR_TERMS["Brainiacs"]="Intello";
FR_TERMS["Infighter"]="Combattant aguerri";
FR_TERMS["Over in a Flash"]="Vitesse époustouflante";
FR_TERMS["Godly Power"]="Pouvoir divin";
FR_TERMS["Warrior Gods"]="Dieux guerriers";
FR_TERMS["Infinite Regeneration"]="Régénération infinie";
FR_TERMS["Fear and Faith"]="Peur et désespoir";
FR_TERMS["Universe's Most Malevolent"]="Le plus puissant peuple";
FR_TERMS["Strongest Clan in Space"]="Le plus puissant peuple";
FR_TERMS["Frieza's Army"]="Armée de Freezer";
FR_TERMS["Cooler's Armored Squad"]="Commando de Cooler";
FR_TERMS["The Saiyan Lineage"]="L’origine des Saiyans";
FR_TERMS["Saiyan Pride"]="Fierté Saiyan";
FR_TERMS["Z Fighters"]="Guerrier Z";
FR_TERMS["Family Ties"]="Liens familiaux";
FR_TERMS["Master of Magic"]="L'étonnant sortilège";
FR_TERMS["Demonic Ways"]="Style de démon";
FR_TERMS["Android Assault"]="Amélioration cybernétique";
FR_TERMS["GT"]="GT";
FR_TERMS["Legendary Power"]="Pouvoir légendaire";
FR_TERMS["Tournament of Power"]="Tournoi du Pouvoir";
FR_TERMS["Sibling's Bond"]="Lien de fratrie";
FR_TERMS["Bond of Master and Disciple"]="Lien maître et disciple";
FR_TERMS["Time Limit"]="Temps limité";
FR_TERMS["Storied Figures"]="Légende ancestrale";
FR_TERMS["Power of Wishes"]="Le pouvoir des vœux";
FR_TERMS["Bond of Friendship"]="Liens d'amitié";
FR_TERMS["Fusion"]="Fusion";
FR_TERMS["Dragon Ball Heroes"]="Dragon Ball Heroes";
FR_TERMS["Final Trump Card"]="Dernier recours";
FR_TERMS["Earth-Bred Fighters"]="Combattants élevés sur Terre";
FR_TERMS["Super Heroes"]="Héros de DB Super";
FR_TERMS["Movie Heroes"]="Héros des films";
FR_TERMS["Movie Bosses"]="Boss des films";
FR_TERMS["GT Heroes"]="Héros de GT";
FR_TERMS["GT Bosses"]="Boss de GT";
FR_TERMS["Pure Saiyans"]="Saiyan pur";
FR_TERMS["Hybrid Saiyans"]="Saiyan de sang-mêlé";
FR_TERMS["Earthlings"]="Terrien";
FR_TERMS["Artificial Life Forms"]="Vie artificielle";
FR_TERMS["Full Power"]="Lutte à pleine puissance";
FR_TERMS["Rapid Growth"]="Croissance rapide";
FR_TERMS["Accelerated Battle"]="Combat rapide";
FR_TERMS["Power Beyond Super Saiyan"]="Puissance au-delà du Super Saiyan";
FR_TERMS["Powerful Comeback"]="Puissance restaurée";
FR_TERMS["Planetary Destruction"]="Destructeurs de planètes";
FR_TERMS["Time Travelers"]="Voyageur du temps";
FR_TERMS["Bond of Parent and Child"]="Lien parental";
FR_TERMS["Joined Forces"]="Forces jointes";
FR_TERMS["Resurrected Warriors"]="Ressuscité";
FR_TERMS["Giant Form"]="Forme géante";
FR_TERMS["World Tournament"]="Tenkaichi Budokai";
FR_TERMS["Realm of Gods"]="Divin";
FR_TERMS["Transformation Boost"]="Transformation fortifiante";
FR_TERMS["Wicked Bloodline"]="Lignée diabolique";
FR_TERMS["Terrifying Conquerors"]="Conquérants terrifiants";
FR_TERMS["Target: Goku"]="Cible : Goku";
FR_TERMS["Revenge"]="Vengeance";
FR_TERMS["Inhuman Deeds"]="Actes inhumains";
FR_TERMS["Corroded Body and Mind"]="Corps et esprit corrompus";
FR_TERMS["Sworn Enemies"]="Ennemis jurés";
FR_TERMS["Gifted Warriors"]="Guerriers de génie";
FR_TERMS["Heavenly Events"]="Péripéties célestes";
FR_TERMS["Battle of Fate"]="Combat du destin";
FR_TERMS["Exploding Rage"]="Colère explosive";
FR_TERMS["Otherworld Warriors"]="Guerriers de l'au-delà";
FR_TERMS["Super Saiyans"]="Super Saiyan";
FR_TERMS["Kamehameha"]="Kamehameha";
FR_TERMS["Majin Buu Saga"]="Saga de Boo";
FR_TERMS["Future Saga"]="Saga du futur";
FR_TERMS["Androids/Cell Saga"]="Saga des cyborgs/Cell";
function isLikelyNonPlayable(x){const s=((x&&[x.name,x.title,x.kind,x.type,x.category,x.description].filter(Boolean).join(' '))||'').toLowerCase();return /(mr\.?\s*satan|hercule).*(statue)|statue.*(mr\.?\s*satan|hercule)|awakening medal|training item|support item|treasure item|objet d'entraînement|médaille d'éveil|objet de soutien/.test(s)}
FR_TERMS["All-Out Struggle"]="Combat acharné";
FR_TERMS["Battle of Wits"]="Combat plein d'astuces";
FR_TERMS["Majin Power"]="Pouvoir de Majin";
FR_TERMS["Rapid Growth"]="Croissance rapide";
FR_TERMS["Power Absorption"]="Absorption de puissance";
FR_TERMS["Heavenly Events"]="Péripéties célestes";
FR_TERMS["Mastered Evolution"]="Évolution maîtrisée";
FR_TERMS["Battle of Fate"]="Combat du destin";
FR_TERMS["Power Beyond Super Saiyan"]="Puissance au-delà du Super Saiyan";
FR_TERMS["Super Bosses"]="Boss de DB Super";
FR_TERMS["Tournament Participants"]="Participants aux tournois";
FR_TERMS["Accelerated Battle"]="Combat rapide";
FR_TERMS["Exploding Rage"]="Colère explosive";
FR_TERMS["Low-Class Warrior"]="Guerrier de classe inférieure";
FR_TERMS["Super Saiyan 2"]="Super Saiyan 2";
FR_TERMS["Super Saiyan 3"]="Super Saiyan 3";
FR_TERMS["Giant Ape Power"]="Puissance du singe géant";
FR_TERMS["Crossover"]="Crossover";
FR_TERMS["Crossover Summon"]="Invocation crossover";
FR_TERMS["Crossover Summons"]="Invocations crossover";
FR_TERMS["Youth"]="Enfance";
FR_TERMS["Peppy Gals"]="Filles pleines de vie";
FR_TERMS["Namekians"]="Namek";
FR_TERMS["Team Bardock"]="Équipe Bardock";
FR_TERMS["Universe 11"]="Univers 11";
FR_TERMS["Warriors Raised on Earth"]="Combattants élevés sur Terre";
FR_TERMS["Saiyan Saga"]="Saga des Saiyans";
FR_TERMS["Planet Namek Saga"]="Saga de Namek";
FR_TERMS["Cell Saga"]="Saga de Cell";
FR_TERMS["Majin Buu Saga"]="Saga de Boo";
FR_TERMS["Shadow Dragon Saga"]="Saga des dragons maléfiques";
FR_TERMS["Movie Bosses"]="Boss des films";
FR_TERMS["Movie Heroes"]="Héros des films";
FR_TERMS["Super Bosses"]="Boss de DB Super";
FR_TERMS["Super Heroes"]="Héros de DB Super";
FR_TERMS["Turtle School"]="École tortue";
FR_TERMS["Uncontrollable Power"]="Puissance incontrôlable";
FR_TERMS["Worthy Rivals"]="Digne rival";
FR_TERMS["High Compatibility"]="Super compatibilité";
FR_TERMS["All in the Family"]="Liens familiaux";
FR_TERMS["Galactic Visitor"]="Visiteur d'ailleurs";
FR_TERMS["The Innocents"]="Innocent";
FR_TERMS["Experienced Fighters"]="Guerrier vétéran";
FR_TERMS["Messenger from the Future"]="Messager du futur";
FR_TERMS["Supreme Warrior"]="Guerrier suprême";
FR_TERMS["Demonic Power"]="Pouvoir démoniaque";
FR_TERMS["Crane School"]="École de la grue";
FR_TERMS["Master and Disciple"]="Disciple";
FR_TERMS["Courage"]="Courage";
FR_TERMS["World Tournament Champion"]="Champion du monde";
FR_TERMS["More Than Meets the Eye"]="Look trompeur";
FR_TERMS["Coward"]="Lâche";
FR_TERMS["Twins"]="Jumeaux";
FR_TERMS["Mechanical Menaces"]="Mécanique";
FR_TERMS["Solid Support"]="Soutien infaillible";
FR_TERMS["Android Assault"]="Amélioration cybernétique";
FR_TERMS["Resurrection 'F'"]="Résurrection 'F'";
FR_TERMS["Despair Future"]="Futur désespéré";
FR_TERMS["The Wall Standing Tall"]="Mur gênant";
FR_TERMS["Supreme Power"]="La puissance suprême";
FR_TERMS["Soul vs Soul"]="Âme vs âme";
FR_TERMS["Limit-Breaking Form"]="Forme brisant la limite";
FR_TERMS["Hatred of Saiyans"]="Haine des Saiyans";
FR_TERMS["Fusion Failure"]="Échec de fusion";
FR_TERMS["Infinite Energy"]="Énergie infinie";
FR_TERMS["Ultimate Lifeform"]="Forme ultime";
FR_TERMS["God's Power"]="Le pouvoir d'un dieu";
FR_TERMS["Dismal Future"]="Futur désespéré";
FR_TERMS["Universe 6's Warriors"]="Guerriers de l'Univers 6";
FR_TERMS["Shadow Dragons"]="Dragons maléfiques";
FR_TERMS["Saiyan Roar"]="Rugissement saiyan";
FR_TERMS["The First Awakened"]="Le premier éveillé";
FR_TERMS["Successors"]="Héritiers";
FR_TERMS["Earth-Bred Fighters"]="Combattants élevés sur Terre";
FR_TERMS["Time Travelers"]="Voyageur du temps";
FR_TERMS["Bond of Master and Disciple"]="Lien maître et disciple";
FR_TERMS["Bond of Parent and Child"]="Lien parent-enfant";
FR_TERMS["Accelerated Battle"]="Combat accéléré";
FR_TERMS["Battle of Fate"]="Combat du destin";
FR_TERMS["Powerful Comeback"]="Puissance restaurée";
FR_TERMS["Entrusted Will"]="Volonté confiée";
FR_TERMS["Connected Hope"]="Aspirations connectées";
FR_TERMS["Final Trump Card"]="Dernier atout";
FR_TERMS["Full Power"]="Pleine puissance";
FR_TERMS["Storied Figures"]="Légende ancestrale";
FR_TERMS["Planetary Destruction"]="Destruction planétaire";
FR_TERMS["Legendary Existence"]="Existence légendaire";
FR_TERMS["Power of Wishes"]="Le pouvoir des vœux";
FR_TERMS["Earthlings"]="Terrien";
FR_TERMS["Power Absorption"]="Absorption de puissance";
FR_TERMS["Youth"]="Enfant";
FR_TERMS["Connected Hope"]="Aspirations connectées";
FR_TERMS["Super Bosses"]="Boss de DB Super";
FR_TERMS["GT Bosses"]="Boss de GT";
FR_TERMS["Movie Bosses"]="Boss des films";
FR_TERMS["Worldwide Chaos"]="Chaos mondial";
FR_TERMS["Dragon Ball Seekers"]="Chercheurs de boules de cristal";
FR_TERMS["Battle of Fate"]="Combat du destin";
FR_TERMS["Accelerated Battle"]="Combat rapide";
FR_TERMS["Earth-Bred Fighters"]="Combattant ayant grandi sur Terre";
FR_TERMS["Otherworld Warriors"]="Combattants de l'au-delà";
FR_TERMS["Ginyu Force"]="Commando Ginyu";
FR_TERMS["Corroded Body and Mind"]="Corps et esprit corrompus";
FR_TERMS["Rapid Growth"]="Croissance rapide";
FR_TERMS["Androids"]="Cyborg";
FR_TERMS["Androids/Cell Saga"]="Cyborg - Saga de cell";

FR_TERMS["Golden Fighters"]="Combattants dorés";
FR_TERMS["Blazing Battle"]="Combat ardent";
FR_TERMS["Mission Execution"]="Exécution de mission";
FR_TERMS["Galactic Warriors"]="Guerriers galactiques";
FR_TERMS["Galactic Warrior"]="Guerrier galactique";
FR_TERMS["Signature Pose"]="Pose signature";
FR_TERMS["The Incredible Adventure"]="Aventure incroyable";
FR_TERMS["Guidance of the Dragon Balls"]="Guide des Dragon Balls";
FR_TERMS["World Tournament Reborn"]="Renaissance du Tenkaichi Budokai";
FR_TERMS["Brutal Beatdown"]="Boost de handicap";
FR_TERMS["Coward"]="Lâche";
FR_TERMS["Mechanical Menaces"]="Mécanique";
FR_TERMS["Solid Support"]="Soutien infaillible";
FR_TERMS["More Than Meets the Eye"]="Look trompeur";

FR_TERMS["Mission Execution"]="Exécution de mission";
FR_TERMS["Blazing Battle"]="Combat ardent";
FR_TERMS["Galactic Warriors"]="Guerriers galactiques";
FR_TERMS["Galactic Warrior"]="Guerrier galactique";
FR_TERMS["Signature Pose"]="Pose signature";
FR_TERMS["Coward"]="Lâche";

FR_TERMS["Final Trump Card"]="Dernier atout";
FR_TERMS["Planetary Destruction"]="Destructeurs de planètes";
FR_TERMS["Inhuman Deeds"]="Diaboliques et sans merci";
FR_TERMS["Worthy Rivals"]="Digne rival";
FR_TERMS["Realm of Gods"]="Divin";
FR_TERMS["Shadow Dragon Saga"]="Dragon maléfique";
FR_TERMS["Turtle School"]="École tortue";
FR_TERMS["Sworn Enemies"]="Ennemi juré";
FR_TERMS["Team Bardock"]="Equipe Bardock";
FR_TERMS["Legendary Existence"]="Être légendaire";
FR_TERMS["Miraculous Awakening"]="Eveil miraculeux";
FR_TERMS["Mastered Evolution"]="Evolution maîtrisée";
FR_TERMS["Exploding Rage"]="Explosion de colère";
FR_TERMS["Goku's Family"]="Famille de Son Goku";
FR_TERMS["Vegeta's Family"]="Famille de Vegeta";
FR_TERMS["Peppy Gals"]="Fille pleine de vie";
FR_TERMS["Joined Forces"]="Forces jointes";
FR_TERMS["Giant Form"]="Forme géante";
FR_TERMS["Fused Fighters"]="Guerrier fusionné";
FR_TERMS["Low-Class Warrior"]="Guerrier inférieur";
FR_TERMS["Gifted Warriors"]="Guerriers de génie";
FR_TERMS["Space-Traveling Warriors"]="Guerriers galactiques";
FR_TERMS["Successors"]="Héritier";
FR_TERMS["Super Heroes"]="Héros de DB Super";
FR_TERMS["GT Heroes"]="Héros de GT";
FR_TERMS["Defenders of Justice"]="Héros de la justice";
FR_TERMS["Movie Heroes"]="Héros des films";
FR_TERMS["Power of Wishes"]="Le Pouvoir des voeux";
FR_TERMS["Storied Figures"]="Légende ancestrale";
FR_TERMS["Sibling's Bond"]="Lien de fratrie";
FR_TERMS["Bond of Master and Disciple"]="Lien maître et disciple";
FR_TERMS["Bond of Parent and Child"]="Lien Parental";
FR_TERMS["Bond of Friendship"]="Liens d'amitié";
FR_TERMS["Wicked Bloodline"]="Lignée diabolique";
FR_TERMS["Full Power"]="Lutte à pleine puissance";
FR_TERMS["Namekians"]="Namek";
FR_TERMS["Target: Goku"]="Objectif Son Goku";
FR_TERMS["Tournament Participants"]="Participants aux tournois";
FR_TERMS["Heavenly Events"]="Péripéties célestes";
FR_TERMS["Special Pose"]="Pose spéciale";
FR_TERMS["Potara"]="Potalas";
FR_TERMS["Majin Power"]="Pouvoir de Majin";
FR_TERMS["Power Beyond Super Saiyan"]="Puissance au-delà du Super Saiyan";
FR_TERMS["Giant Ape Power"]="Puissance de Gorille";
FR_TERMS["Uncontrollable Power"]="Puissance incontrôlable";
FR_TERMS["Powerful Comeback"]="Puissance restaurée";
FR_TERMS["Representatives of Universe 7"]="Représentants de l'Univers 7";
FR_TERMS["Resurrected Warriors"]="Ressuscité";
FR_TERMS["Majin Buu Saga"]="Saga de Boo";
FR_TERMS["Planet Namek Saga"]="Saga de Namek";
FR_TERMS["Saiyan Saga"]="Saga des Saiyans";
FR_TERMS["Future Saga"]="Saga du futur";
FR_TERMS["Hybrid Saiyans"]="Saiyan de sang-mêlé";
FR_TERMS["Pure Saiyans"]="Saiyan pur";
FR_TERMS["Saviors"]="Sauveur";
FR_TERMS["Super Saiyans"]="Super Saiyan";
FR_TERMS["Universe Survival Saga"]="Survie de l'Univers";
FR_TERMS["Time Limit"]="Temps limité";
FR_TERMS["World Tournament"]="Tenkaichi Budokai";
FR_TERMS["Earthlings"]="Terrien";
FR_TERMS["Terrifying Conquerors"]="Terrifiants conquérants";
FR_TERMS["Transformation Boost"]="Transformation fortifiante";
FR_TERMS["Revenge"]="Vengeance";
FR_TERMS["Artificial Life Forms"]="Vie artificielle";
FR_TERMS["Entrusted Will"]="Volonté confiée";
FR_TERMS["Time Travelers"]="Voyageur du temps";
FR_TERMS["The Saiyan Lineage"]="L'origine des saiyans";
FR_TERMS["Saiyan Warrior Race"]="Race saiyan";
FR_TERMS["Prodigies"]="Génie";
FR_TERMS["Cold Judgment"]="Jugement serein";
FR_TERMS["Brainiacs"]="Intello";
FR_TERMS["Solid Support"]="Soutien infaillible";
FR_TERMS["Experienced Fighters"]="Guerrier vétéran";
FR_TERMS["Infighter"]="Fonceur";
FR_TERMS["Shocking Speed"]="Vitesse époustouflante";
FR_TERMS["Turtle School"]="École tortue";
FR_TERMS["High Compatibility"]="Super compatibilité";
FR_TERMS["All in the Family"]="Liens familiaux";
FR_TERMS["Galactic Visitor"]="Visiteur d'ailleurs";
FR_TERMS["Messenger from the Future"]="Messager du futur";
function frTerm(v){
  const s=String(v||'').trim();
  if(!s)return s;
  return FR_TERMS[s]||s
    .replace(/\bGolden Fighters\b/g,'Combattants dorés')
    .replace(/\bMission Execution\b/g,'Exécution de mission')
    .replace(/\bGinyu Force\b/g,'Commando Ginyu')
    .replace(/\bGalactic Warriors?\b/g,'Guerriers galactiques');
}
function frList(a){return (a||[]).map(frTerm)}

async function boot(){
  const readJSON=async(path,fallback)=>{try{const r=await fetch(path);return r.ok?await r.json():fallback}catch(e){return fallback}};
  const [collection,meta,catalog,overlap,recent]=await Promise.all([
    readJSON('collection.json',null),readJSON('card-meta.json',{cards:{}}),
    readJSON('catalog.json',{cards:[]}),readJSON('overlap-conflicts.json',{conflicts:[]}),
    readJSON('recent-cards.json',null)
  ]);
  DB=collection;
  if(!DB||!Array.isArray(DB.cards))DB=await readJSON('data.json',null);
  if(!DB||!Array.isArray(DB.cards))throw new Error('Collection DokkanOS invalide');
  META=record(meta)&&record(meta.cards)?meta:{cards:{}};
  CATALOG=record(catalog)&&Array.isArray(catalog.cards)?catalog:{cards:[]};
  OVERLAP=record(overlap)&&Array.isArray(overlap.conflicts)?overlap:{conflicts:[]};
  mergeRecentCards(recent);
  CATALOG.cards=CATALOG.cards.filter(c=>c.rarity!=='SR');
  applyMetadata();restoreEdits();initAdvancedFilters();
  render();stats();renderDuplicates();renderMissing();renderInventory();renderManualOwned();renderTeam();renderAnalysis();
}
function mergeRecentCards(data){if(!Array.isArray(data?.cards))return;META.cards=META.cards||{};CATALOG.cards=CATALOG.cards||[];for(const c of data.cards){if(!/^\d+$/.test(String(c.id))||!c.name||!['SSR','UR','LR'].includes(c.rarity))continue;const id=String(c.id),old=META.cards[id]||{};META.cards[id]={...c,...old,teamRules:{...c.teamRules,...old.teamRules}};if(!CATALOG.cards.some(x=>String(x.id)===id))CATALOG.cards.unshift({...c,id});}CACHED_FAMILIES=CACHED_FAMILY_BY_ID=null;}
function localized(m){if(!m)return null;let fr=m.fr||{},off=!!fr._official;return {...m,name:frCardName(fr.name||m.name),title:frTerm(fr.title||m.title),type:fr.type||m.type,class:fr.class||m.class,categories:frList(fr.categories||m.categories),links:frList(fr.links||m.links),leader:fr.leader||m.leader,passiveName:fr.passiveName||m.passiveName,passive:fr.passive||m.passive,superAttack:fr.superAttack||m.superAttack,ultraSuperAttack:fr.ultraSuperAttack||m.ultraSuperAttack,activeName:fr.activeName||m.activeName,active:fr.active||m.active,transformations:fr.transformations||m.transformations,_officialFR:off}}
function applyMetadata(){DB.cards.forEach(c=>{let m=localized(META.cards?.[String(c.candidateId)]);if(m)Object.assign(c,m);c.name=frCardName(c.name||'');c.title=frTerm(c.title||'');c.categories=frList(c.categories);c.links=frList(c.links)})}
function confClass(c){return c==='Très forte'?'tf':c==='Forte'?'f':c==='Moyenne'?'m':c==='Validée manuellement'?'manual':'v'}
function restoreEdits(){
  const edits=storedJSON('dokkanos-edits',[]);
  if(Array.isArray(edits))for(const a of edits){if(!record(a))continue;const c=DB.cards.find(x=>x.boxId===a.boxId);if(!c)continue;if(a.candidateId&&!assignIdentification(c,a.candidateId))continue;c._edited=true;c.validated=a.validated===true;c.confidence=c.validated?'Validée manuellement':'À revoir'}
  const inv=storedJSON('dokkanos-inventory',{});inventory=record(inv)?Object.fromEntries(Object.entries(inv).filter(([id,state])=>/^\d+$/.test(id)&&['owned','missing'].includes(state))):{};
  const team=storedJSON('dokkanos-team',[]);selectedTeam=Array.isArray(team)?[...new Set(team.filter(id=>typeof id==='string'&&(DB.cards.some(c=>c.boxId===id)||(id.startsWith('MANUAL-')&&inventory[id.slice(7)]==='owned'))))].slice(0,6):[];
  try{teamLeader=storageRead('dokkanos-team-leader')||'';if(teamLeader&&!resolveCard(teamLeader))teamLeader=''}catch(e){teamLeader=''}
  const fav=storedJSON('dokkanos-favorites',[]),rainbow=storedJSON('dokkanos-rainbow100',[]);favorites=new Set(Array.isArray(fav)?fav.filter(x=>typeof x==='string'):[]);rainbow100=new Set(Array.isArray(rainbow)?rainbow.filter(x=>typeof x==='string'||typeof x==='number').map(String):[]);
  const potential=storedJSON('dokkanos-potential-manual',{});potentialManual=record(potential)?Object.fromEntries(Object.entries(potential).filter(([id,n])=>/^\d+$/.test(id)&&Number.isInteger(n)&&n>=0&&n<=4)):{};
}
function searchText(c){return norm([c.boxId,c.candidateId,c.name,c.title,c.rarity,c.type,c.class,skillText(c.leader),skillText(c.passive),skillText(c.superAttack),skillText(c.active),...(c.categories||[]),...(c.links||[])].join(' '))}
function cardMatchesFilters(c){return (filter==='all'||(filter==='valid'&&c.validated)||(filter==='check'&&!c.validated))&&(!query||searchText(c).includes(query))&&(!rarityFilter||c.rarity===rarityFilter)&&(!typeFilter||c.type===typeFilter)&&(!classFilter||c.class===classFilter)&&(!categoryFilter||(c.categories||[]).includes(categoryFilter))&&(!linkFilter||(c.links||[]).includes(linkFilter))&&(!ezaFilter||(ezaFilter==='yes'?!!c.eza:!c.eza))&&(!favoriteOnly||favorites.has(c.boxId))}
function visibleCards(){
  let a=DB.cards.filter(cardMatchesFilters);
  if(sortMode==='confidence')a.sort((x,y)=>(y.inliers||0)-(x.inliers||0));
  if(sortMode==='id')a.sort((x,y)=>String(x.candidateId).localeCompare(String(y.candidateId)));if(sortMode==='name')a.sort((x,y)=>(x.name||'').localeCompare(y.name||'','fr'));if(sortMode==='rarity'){let r={LR:5,UR:4,SSR:3,SR:2,R:1,N:0};a.sort((x,y)=>(r[y.rarity]??-1)-(r[x.rarity]??-1))}if(sortMode==='type'){let t={AGI:0,TEC:1,INT:2,PUI:3,END:4};a.sort((x,y)=>(t[x.type]??9)-(t[y.type]??9))}
  return a;
}
function initAdvancedFilters(){let cats=[...new Set([...DB.cards,...ownedTeamCards()].flatMap(c=>c.categories||[]))].sort((a,b)=>a.localeCompare(b,'fr')),links=[...new Set([...DB.cards,...ownedTeamCards()].flatMap(c=>c.links||[]))].sort((a,b)=>a.localeCompare(b,'fr'));$('#categoryFilter').innerHTML='<option value="">Catégorie</option>'+cats.map(x=>`<option>${x}</option>`).join('');$('#linkFilter').innerHTML='<option value="">Lien</option>'+links.map(x=>`<option>${x}</option>`).join('');$('#categoryFilter').value=categoryFilter;$('#linkFilter').value=linkFilter}
function toggleFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);storageWrite('dokkanos-favorites',JSON.stringify([...favorites]));render();renderManualOwned();renderAnalysis();openCard(id)}
function activeFilterSummary(){let x=[];if(query)x.push('Recherche');if(filter!=='all')x.push(filter==='valid'?'Validées':'À vérifier');if(rarityFilter)x.push(rarityFilter);if(typeFilter)x.push(typeFilter);if(classFilter)x.push(classFilter);if(categoryFilter)x.push(categoryFilter);if(linkFilter)x.push(linkFilter);if(ezaFilter)x.push(ezaFilter==='yes'?'EZA':'Non-EZA');if(favoriteOnly)x.push('★ Favoris');let el=$('#activeFilters');if(el)el.innerHTML=x.length?x.map(v=>`<span>${v}</span>`).join(''):''}
function render(){
  let a=visibleCards();activeFilterSummary();
  $('#grid').innerHTML=a.map(c=>`<article class="unit" onclick="openCard('${c.boxId}')"><i class="dot ${confClass(c.confidence)}"></i>${favorites.has(c.boxId)?'<b class="favmark">★</b>':''}${rainbow100.has(String(c.candidateId))?'<b class="rainbowmark" title="Potentiel 100 %">🌈 100 %</b>':''}<img loading="lazy" src="${c.image}" onerror="imageFallback(this,'${String(c.candidateId||'')}','${c.image||''}')"><div class="meta"><strong>${frCardName(c.name||'ID '+(c.candidateId||'—'))}</strong><small>${c.boxId} · ${c.confidence}</small></div></article>`).join('')||'<div class="empty">Aucune carte</div>';
  $('#resultCount').textContent=a.length+' résultat'+(a.length>1?'s':'');
  renderVerify();renderManualOwned();
}
function stats(){
  let v=DB.cards.filter(c=>c.validated).length, unique=ownedIds().size;
  $('#nAll').textContent=DB.cards.length;$('#nVal').textContent=v;$('#nCheck').textContent=DB.cards.length-v;$('#nUnique').textContent=unique;
  $('#progressBar').style.width=(DB.cards.length?Math.round(v/DB.cards.length*100):0)+'%';
  $('#progressText').textContent=(DB.cards.length?Math.round(v/DB.cards.length*100):0)+'% validé';
}
const NON_PLAYABLE_NAME_RE=/(statue de (m\.?\s*satan)|hercule statue|mr\.? satan statue)/i;
const FR_NAME_FIXES=[
 [/Golden Metal Cooler/gi,'Golden Métal Cooler'],[/Golden Métal Cooler/gi,'Golden Métal Cooler'],[/Golden Frieza/gi,'Golden Freezer'],[/Frieza \(1st Form\)/gi,'Freezer (1re forme)'],[/Frieza \(2nd Form\)/gi,'Freezer (2e forme)'],[/Frieza \(3rd Form\)/gi,'Freezer (3e forme)'],[/Frieza \(Full Power\)/gi,'Freezer (pleine puissance)'],[/Frieza \(Final Form\)/gi,'Freezer (forme finale)'],[/Golden Cooler/gi,'Golden Coola'],[/Metal Cooler/gi,'Métal Cooler'],[/Full Power Boujack/gi,'Bojack puissance max'],[/\bBoujack\b/gi,'Bojack'],[/\bBojack\b/gi,'Bojack'],[/Mecha Frieza/g,'Mecha Freezer'],[/Frieza/g,'Freezer'],[/Captain Ginyu/g,'Ginyu'],
 [/Fusion Android #?(\d+)/gi,'Fusion C-$1'],[/Androids #?(\d+)\s*\(Future\)\s*&\s*#?(\d+)\s*\(Future\)/gi,'C-$1 (futur) & C-$2 (futur)'],[/Android #?(\d+)\s*\(Future\)/gi,'C-$1 (futur)'],[/Androids #?(\d+)\s*&\s*#?(\d+)/gi,'C-$1 & C-$2'],[/Army of the Dead/gi,'Armée des morts'],[/Krillin/gi,'Krilin'],[/Hercule/gi,'M. Satan'],[/Android #?(\d+)/g,'C-$1'],[/Androids #?(\d+)/g,'C-$1'],[/Master Roshi/g,'Kamesennin'],[/Mercenary Tao/g,'Tao Pai Pai'],[/\bTien\b/g,'Tenshinhan'],
 [/Chiaotzu/g,'Chaozu'],[/Jeice/g,'Jeese'],[/Recoome/g,'Reacum'],[/Burter/g,'Butta'],[/Pikkon/g,'Paikuhan'],
 [/West Supreme Kai/gi,'Kaio Shin de l’Ouest'],[/Supreme Kai of Time/gi,'Kaio Shin du Temps'],[/Supreme Kai/gi,'Kaio Shin'],[/Omega Shenron/gi,'Omega Shenron'],[/Syn Shenron/gi,'Li Shenron'],[/Nuova Shenron/gi,'Suu Shenron'],[/Buu \(Kid\)/gi,'Boo (petit)'],[/Majin Buu \(Gotenks\)/gi,'Boo (Gotenks)'],[/Majin Buu \(Piccolo\)/gi,'Boo (Piccolo)'],[/Majin Buu \(Pure Evil\)/gi,'Boo (mal pur)'],[/Majin Buu \(Good\)/gi,'Boo (gentil)'],[/Majin Buu \(Shape-Up\)/gi,'Boo (mince)'],[/Majin Buu \(Ultimate Gohan\)/gi,'Boo (Son Gohan ultime)'],[/Majin Buu \(South Supreme Kai\)/gi,'Boo (Kaio Shin du Sud)'],[/King Cold/g,'Roi Cold'],[/King Vegeta/g,'Roi Vegeta'],[/King Piccolo/gi,'Piccolo Daimaô'],[/Kid Buu/g,'Boo (petit)'],[/Super Buu/g,'Boo (super)'],
 [/Super Saiyan God SS Evolved Vegeta/gi,'Vegeta Super Saiyan divin SS évolué'],[/Super Full Power Saiyan 4 Limit Breaker Goku/gi,'Son Goku Super Saiyan 4 ultra puissance max - Limites brisées'],[/Super Full Power Saiyan 4 Limit Breaker Vegeta/gi,'Vegeta Super Saiyan 4 ultra puissance max - Limites brisées'],[/Super Full Power Saiyan 4 Goku/gi,'Son Goku Super Saiyan 4 ultra puissance max'],[/Super Saiyan God SS Goku/gi,'Son Goku Super Saiyan divin SS'],[/Super Saiyan God Goku/gi,'Son Goku Super Saiyan divin'],[/Super Saiyan 3 Goku/gi,'Son Goku Super Saiyan 3'],[/Super Saiyan Goku/gi,'Son Goku Super Saiyan'],[/Super Saiyan 4 Goku/gi,'Son Goku Super Saiyan 4'],[/Super Saiyan 4 Bardock/gi,'Bardock Super Saiyan 4'],[/Super Saiyan 4 Gohan/gi,'Son Gohan Super Saiyan 4'],[/Super Saiyan 4 Broly/gi,'Broly Super Saiyan 4'],[/Super Saiyan 4 Vegito/gi,'Vegetto Super Saiyan 4'],[/Super Saiyan Goku Jr\./gi,'Son Goku Jr Super Saiyan'],[/Super Saiyan Vegeta Jr\./gi,'Vegeta Jr Super Saiyan'],[/Super Saiyan 3 Gohanks/gi,'Gohanks Super Saiyan 3'],[/Super Saiyan 3 Gotenks/gi,'Gotenks Super Saiyan 3'],[/Super Saiyan Vegeks/gi,'Vegetrunks Super Saiyan'],[/Super Saiyan God Trunks/gi,'Trunks Super Saiyan divin'],[/Super Saiyan God SS Vegeta/gi,'Vegeta Super Saiyan divin SS'],[/Super Saiyan 3 Vegeta/gi,'Vegeta Super Saiyan 3'],[/Super Saiyan 2 Vegeta/gi,'Vegeta Super Saiyan 2'],[/Super Saiyan Vegeta/gi,'Vegeta Super Saiyan'],[/Super Saiyan 4 Vegeta/gi,'Vegeta Super Saiyan 4'],[/Super Saiyan God SS Vegito/gi,'Vegetto Super Saiyan divin SS'],[/Super Saiyan 2 Gohan \(Youth\)/gi,'Son Gohan Super Saiyan 2 (enfant)'],[/Super Saiyan Gohan \(Youth\)/gi,'Son Gohan Super Saiyan (enfant)'],[/Super Saiyan 2 Gohan \(Teen\)/gi,'Son Gohan Super Saiyan 2 (jeune)'],[/Super Saiyan Gohan \(Teen\)/gi,'Son Gohan Super Saiyan (jeune)'],[/Gohan \(Kid\)/g,'Son Gohan (petit)'],[/Gohan \(Youth\)/g,'Son Gohan (enfant)'],[/Gohan \(Teen\)/g,'Son Gohan (jeune)'],
 [/Uub \(Teen\)/gi,'Oob (jeune)'],[/Uub \(Youth\)/gi,'Oob (jeune)'],[/Goku \(Dokkan Butoden\)/gi,'Son Goku (Dokkan Butoden)'],[/Goku \(Kaioken\)/gi,'Son Goku (Kaioken)'],[/Goku \(Angel\)/gi,'Son Goku (ange)'],[/Goku \(Youth\)/gi,'Son Goku (enfant)'],[/Gohan \(Future\)/gi,'Son Gohan (futur)'],[/Mai \(Future\)/gi,'Mai (futur)'],[/Trunks \(Future\)/gi,'Trunks (futur)'],[/Super Saiyan Trunks \(Future\)/gi,'Trunks Super Saiyan (futur)'],[/Super Saiyan Trunks \(Teen\)/gi,'Trunks Super Saiyan (jeune)'],[/Super Saiyan Trunks \(Kid\)/gi,'Trunks Super Saiyan (petit)'],[/Super Saiyan Goten \(Kid\)/gi,'Son Goten Super Saiyan (petit)'],[/Trunks \(Kid\)/gi,'Trunks (petit)'],[/Goten \(Kid\)/gi,'Son Goten (petit)'],[/Gohan \(Youth\)/gi,'Son Gohan (enfant)'],[/Gohan \(Teen\)/gi,'Son Gohan (jeune)'],[/Trunks \(Teen\)/gi,'Trunks (jeune)'],[/Trunks \(Youth\)/gi,'Trunks (jeune)'],[/Trunks \(Kid\)/gi,'Trunks (petit)'],
 [/Demon King Piccolo \(Elder\)/gi,'Piccolo Daimaô (vieux)'],[/Demon King Piccolo/gi,'Piccolo Daimaô'],
 [/Cell \(1st Form\)/gi,'Cell (1re forme)'],[/Cell \(2nd Form\)/gi,'Cell (2e forme)'],[/Cell \(Perfect Form\)/gi,'Cell (forme parfaite)'],[/Perfect Cell/gi,'Cell Parfait'],
 [/Goku Black/gi,'Son Goku Black'],[/Frost \(Full Power\)/gi,'Frost (pleine puissance)'],[/Jiren \(Full Power\)/gi,'Jiren (pleine puissance)'],[/Broly \(Wrathful\)/gi,'Broly (colère)'],[/Broly \(Kid\)/gi,'Broly (petit)'],[/Broly \(Youth\)/gi,'Broly (jeune)'],
 [/Piccolo \(Power Awakening\)/gi,'Piccolo (éveil de puissance)'],[/Piccolo \(Fused with Kami\)/gi,'Piccolo (fusion avec Kami)'],
 [/\(Golden Giant Ape\)/gi,'(gorille doré)'],[/\(Giant Ape\)/gi,'(gorille)'],[/\(Giant Form\)/gi,'(forme géante)'],[/Giru/gi,'Gill'],[/Chi-Chi/gi,'Chichi'],[/Dark King Fu/gi,'Fu roi des ténèbres'],[/Dark King Mechikabura/gi,'Mechikabura roi des ténèbres'],[/Demon God Salsa/gi,'Salsa démoniaque'],[/Masked Saiyan/gi,'Saiyan masqué'],[/Black Masked Saiyan/gi,'Saiyan masqué noir'],[/Dark Masked King/gi,'Roi masqué des ténèbres'],[/Brainwashed/gi,'contrôlé mentalement'],[/Transformed, Good/gi,'transformée, gentille'],[/Transformed/gi,'transformée'],[/Galactic Warrior/gi,'guerrier galactique'],[/Power of Time Unleashed/gi,'puissance du temps libérée'],[/Limit Breaker/gi,'Limite brisée'],[/Demon God Dabura/gi,'Majin Dabra'],[/Dabura/gi,'Dabra'],[/Great Ape/gi,'gorille géant'],[/Team Universe 7/gi,'Équipe Univers 7'],[/Cooler's Armored Squad/gi,'Escadron blindé de Coola'],[/Thouser/gi,'Sauzer'],[/Team Bardock/gi,'Équipe Bardock'],[/Lord Slug/gi,'Slug'],[/Mecha Frieza/gi,'Mecha Freezer'],[/Ultimate Gohan/gi,'Son Gohan ultime'],
 [/Shadow Dragon Army/gi,'Équipe des dragons maléfiques'],[/Legion of Shadow Dragons/gi,'Équipe des dragons maléfiques'],
 [/Great Saiyaman/gi,'Great Saiyaman'],[/Turles/gi,'Thalès'],[/General Blue/gi,'Commandant Blue'],[/Dr\. Gero/g,'Dr Gero'],
 [/Goten \(Kid\)/g,'Son Goten (petit)'],[/Trunks \(Kid\)/g,'Trunks (petit)'],[/Bulma \(Youth\)/g,'Bulma (enfant)'],[/Pan \(Kid\)/g,'Pan (petit)'],
 [/\bGoku\b/g,'Son Goku'],[/\bBuu\b/g,'Boo'],[/\bGood\b/gi,'gentil'],[/\bEvil\b/gi,'maléfique'],[/\bGinyu Force\b/gi,'Commando Ginyu'],[/\bGalactic Warrior\b/gi,'Guerrier galactique'],[/\bJeese\b/gi,'Jeese'],[/\bButta\b/gi,'Butta'],[/\bAhms \(2nd Form\)/gi,'Ahms (2e forme)'],[/\b1st Form\b/gi,'1re forme'],[/\b2nd Form\b/gi,'2e forme'],[/\b3rd Form\b/gi,'3e forme'],[/\bFinal Form\b/gi,'forme finale'],[/\bGiant Ape\b/gi,'gorille géant'],[/\(Angel\)/g,'(ange)'],[/\(Future\)/g,'(futur)']
];
const FR_FORM_FIXES=[
 [/\(Elder\)/gi,'(vieux)'],[/\(Teen\)/gi,'(jeune)'],[/\(Youth\)/gi,'(jeune)'],[/\(Kid\)/gi,'(petit)'],
 [/\(Future\)/gi,'(futur)'],[/\(Angel\)/gi,'(ange)'],[/\(1st Form\)/gi,'(1re forme)'],[/\(2nd Form\)/gi,'(2e forme)'],
 [/\(3rd Form\)/gi,'(3e forme)'],[/\(Final Form\)/gi,'(forme finale)'],[/\(Perfect Form\)/gi,'(forme parfaite)'],
 [/Power Awakening/gi,'éveil de puissance'],[/Full Power/gi,'pleine puissance'],[/Super Saiyan Bardock/gi,'Bardock Super Saiyan'],[/Legendary Super Saiyan/gi,'Super Saiyan Légendaire']
];
function frCardName(v){let s=String(v||'');for(const [re,to] of FR_NAME_FIXES)s=s.replace(re,to);for(const [re,to] of FR_FORM_FIXES)s=s.replace(re,to);s=s.replace(/\bSon(?:\s+Son)+\s+Goku\b/gi,'Son Goku').replace(/\bSon(?:\s+Son)+\s+Gohan\b/gi,'Son Gohan').replace(/\bSon(?:\s+Son)+\s+Goten\b/gi,'Son Goten').replace(/\s+/g,' ').trim();return s}
function cardImageCandidates(id,preferred){
  id=String(id||'');let rid=localAssetIdFor(id),cat=(CATALOG.cards||[]).find(x=>String(x.id)===id)||{};
  const exactRemote=cat.image||preferred;
  return [...new Set([
    exactRemote,
    id&&('assets/cards/'+id+'.webp'),id&&('assets/cards/'+id+'.png'),
    rid&&('assets/cards/'+rid+'.webp'),rid&&('assets/cards/'+rid+'.png')
  ].filter(Boolean))];
}
function imageFallback(el,id,preferred){const a=cardImageCandidates(id,preferred);let tried=[];try{tried=JSON.parse(el.dataset.triedImages||'[]')}catch(e){}if(!Array.isArray(tried))tried=[];tried.push(el.getAttribute('src'));const next=a.find(src=>!tried.includes(src));el.dataset.triedImages=JSON.stringify(tried);if(next){el.src=next}else{el.classList.add('imgfail');reportBrokenImage(id)}}
function imageAuditSummary(){try{const a=JSON.parse(storageRead('dokkanos-broken-images')||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
function reportBrokenImage(id){if(!id)return;try{let a=JSON.parse(storageRead('dokkanos-broken-images')||'[]');if(!a.includes(String(id))){a.push(String(id));storageWrite('dokkanos-broken-images',JSON.stringify(a))}}catch(e){}}
function isPlayableCard(card){
  if(!card)return false;
  if(isLikelyNonPlayable(card))return false;
  const name=[card.name,card.title,card.fr?.name,card.fr?.title].filter(Boolean).join(' ');
  if(NON_PLAYABLE_NAME_RE.test(name))return false;
  const leader=String(card.leader||card.fr?.leader||'');
  const hp=Number(card.hpMax??card.hp_max??card.hp??NaN),atk=Number(card.atkMax??card.atk_max??card.atk??NaN),def=Number(card.defMax??card.def_max??card.def??NaN);
  if(/personnage à vendre|character to sell|sell-only|for sale/i.test(leader))return false;
  if(hp===0&&atk===0&&def===0)return false;
  return true;
}
function bestFrenchName(meta,cat){
  const raw=META.cards?.[String(meta?.id||cat?.id||'')]||{};
  const candidates=[
    raw.fr?._official&&raw.fr?.name?raw.fr.name:'',
    cat?.nameFr||cat?.fr?.name||'',
    meta?._officialFR&&meta?.name?meta.name:'',
    raw.fr?.name||'',
    cat?.name||'',
    meta?.name||raw.name||''
  ].filter(Boolean);
  return frCardName(candidates[0]||'');
}
function localAssetIdFor(cardId){
  cardId=String(cardId||''); if(!cardId)return '';
  const cat=(CATALOG.cards||[]).find(x=>String(x.id)===cardId)||{};
  const m=META.cards?.[cardId]||{};
  const explicit=cat.resourceId||cat.resource_id||m.resourceId||m.resource_id||cat.imageId||m.imageId;
  if(explicit)return String(explicit);
  // Les fiches Dokkan peuvent avoir un ID logique ...1 tandis que leurs assets officiels
  // portent un autre resourceId (souvent ...0). On ne le déduit jamais : il doit être déclaré.
  return cardId;
}
function localCardImage(cardId,preferred){
  const id=String(cardId||''),rid=localAssetIdFor(id);
  const cat=(CATALOG.cards||[]).find(x=>String(x.id)===id)||{};
  return cat.image||preferred||(rid?'assets/cards/'+rid+'.webp':'')||'';
}
function verifyCandidate(id){id=String(id||'');if(!id)return null;let raw=META.cards?.[id],entry=(CATALOG.cards||[]).find(x=>String(x.id)===id);if(!raw&&!entry)return null;let m=localized(raw)||{},cat=entry||{};let image=localCardImage(id,cat.image||m.image);return {id,...m,...cat,rarity:cat.rarity||m.rarity,type:cat.type||m.type,class:cat.class||m.class,name:bestFrenchName({...m,id},cat),title:frTerm(cat.titleFr||cat.fr?.title||m.title||cat.title),categories:frList(cat.fr?.categories||m.categories||cat.categories),links:frList(cat.fr?.links||m.links||cat.links),image}}
function verifyCatalogue(){let seen=new Set(),out=[];(CATALOG.cards||[]).forEach(c=>{let id=String(c.id||'');if(id&&!seen.has(id)){let card=verifyCandidate(id);if(card&&isPlayableCard(card)){seen.add(id);out.push(card)}}});Object.keys(META.cards||{}).forEach(id=>{if(!seen.has(String(id))){let card=verifyCandidate(id);if(card&&isPlayableCard(card)){seen.add(String(id));out.push(card)}}});return out}
let verifyDraft={boxId:'',cardId:'',query:''};

function verifyPending(){
  const priority=new Set((OVERLAP.conflicts||[]).flatMap(x=>x.observations||[]));
  return DB.cards.filter(c=>!c.validated).sort((a,b)=>(priority.has(b.boxId)?1:0)-(priority.has(a.boxId)?1:0));
}
function verifySelectPosition(boxId){
  verifyDraft={boxId:String(boxId),cardId:'',query:''};
  renderVerify();
  requestAnimationFrame(()=>{const x=document.getElementById('verifyFinder');if(x){x.focus();x.scrollIntoView({behavior:'smooth',block:'center'})}});
}
function verifySetQuery(value){verifyDraft.query=String(value||'');renderVerifyResults()}
function verifyResults(){
  const raw=verifyDraft.query.trim(),q=norm(raw);if(!q)return [];
  const terms=q.split(/\s+/).filter(Boolean);
  return verifyCatalogue().map(card=>{
    const hay=norm([card.id,card.name,card.title,card.rarity,card.type,card.class,...(card.categories||[])].join(' '));
    let score=0;for(const t of terms)if(hay.includes(t))score+=2;
    if(String(card.id)===raw)score+=200;if(norm(card.name||'').startsWith(q))score+=40;if(hay.includes(q))score+=20;
    return {card,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.card.name||'').localeCompare(String(b.card.name||''),'fr')).slice(0,80).map(x=>x.card);
}
function awakeningLabel(card,rows){
  const family=familyFor(card?.id);if(family.length<2)return '';
  if(card.awakensTo)return family.some(x=>String(x.awakensTo)===String(card.id))?'Éveil intermédiaire':'Base';
  return family.some(x=>String(x.awakensTo)===String(card.id))?'Éveil final':'';
}
function renderVerifyResults(){
  const host=document.getElementById('verifyResults');if(!host)return;
  const rows=verifyResults();
  host.innerHTML=verifyDraft.query.trim()?(rows.map(card=>{const stage=awakeningLabel(card,rows);return '<label class="verify-result-row"><input type="radio" name="verify-card" value="'+String(card.id)+'" '+(verifyDraft.cardId===String(card.id)?'checked':'')+'><img src="'+(card.image||'')+'" onerror="imageFallback(this,\''+String(card.id)+'\',\''+(card.image||'')+'\')"><span><b>'+(card.name||'ID '+card.id)+(stage?' · '+stage:'')+'</b><small>'+[card.rarity||'',card.type||'','ID '+card.id].filter(Boolean).join(' · ')+'</small></span></label>'}).join('')||'<div class="empty compact">Aucune carte trouvée. Essaie un autre mot ou l’ID Dokkan.</div>'):'<div class="verify-tip">Saisis un nom ou un ID pour afficher les cartes.</div>';
}
function verifyChooseCard(id){
  verifyDraft.cardId=String(id||'');
  const btn=document.getElementById('verifyConfirm');if(btn)btn.disabled=!verifyDraft.cardId;
  document.querySelectorAll('#verifyResults .verify-result-row').forEach(row=>row.classList.toggle('selected',row.querySelector('input')?.value===verifyDraft.cardId));
}
function verifyConfirm(){
  const boxId=verifyDraft.boxId,cardId=verifyDraft.cardId;
  const c=DB.cards.find(x=>String(x.boxId)===String(boxId));
  if(!c||!cardId){verifyMessage('Choisis d’abord une position et une carte.','error');return}
  const candidate=verifyCandidate(cardId);if(!candidate){verifyMessage('Carte ID '+cardId+' introuvable dans le catalogue.','error');return}
  if(!assignIdentification(c,cardId)){verifyMessage('Cette carte ne peut pas être sélectionnée.','error');return}
  c._edited=true;c.validated=true;c.confidence='Validée manuellement';
  const saved=saveEdits();
  verifyDraft={boxId:'',cardId:'',query:''};
  render();stats();renderDuplicates();renderMissing();renderInventory();renderManualOwned();renderAnalysis();
  verifyMessage('✓ '+(c.name||'ID '+cardId)+' a été validée.'+(saved?'':' Sauvegarde locale indisponible.'),saved?'ok':'error');
}
function verifySkip(){
  const c=DB.cards.find(x=>String(x.boxId)===String(verifyDraft.boxId));if(c){c._edited=true;c.validated=false;c.confidence='À revoir';saveEdits()}
  verifyDraft={boxId:'',cardId:'',query:''};renderVerify();verifyMessage('Position laissée à vérifier.','ok');
}
function verifyCancel(){verifyDraft={boxId:'',cardId:'',query:''};renderVerify()}
function verifyMessage(msg,kind='ok'){const el=document.getElementById('verificationStatus');if(!el)return;el.textContent=msg;el.className='verify-status '+kind;el.hidden=false}
function renderVerify(){
  const root=document.getElementById('verifyList');if(!root)return;
  const pending=verifyPending(),selected=verifyDraft.boxId?DB.cards.find(x=>String(x.boxId)===verifyDraft.boxId):null;
  if(selected){
    root.innerHTML='<section class="verify-v2-editor"><button type="button" class="verify-back" id="verifyCancel">‹ Retour à la liste</button><div class="verify-v2-source"><img src="'+(selected.crop||selected.image||'')+'" onerror="this.classList.add(\'imgfail\')"><div><small>Position à identifier</small><h3>'+selected.boxId+'</h3><p>'+(selected.capture||'')+' '+(selected.position||'')+'</p></div></div><label class="verify-finder-label" for="verifyFinder">Rechercher la carte correspondante</label><input id="verifyFinder" class="search verify-finder" autocomplete="off" placeholder="Nom du personnage ou ID Dokkan…" value="'+verifyDraft.query.replace(/"/g,'&quot;')+'"><div id="verifyResults" class="verify-v2-results"></div><div class="verify-v2-confirm"><div id="verifySelectionText">'+(verifyDraft.cardId?'Carte sélectionnée : ID '+verifyDraft.cardId:'Sélectionne une carte dans les résultats')+'</div><button type="button" id="verifyConfirm" class="primary" '+(verifyDraft.cardId?'':'disabled')+'>Valider cette carte</button><button type="button" id="verifySkip">Laisser à vérifier</button></div></section>';
    renderVerifyResults();return;
  }
  root.innerHTML='<div class="verify-v2-summary"><b>'+pending.length+'</b><span>positions restent à identifier</span></div><div class="verify-v2-list">'+pending.slice(0,verifyLimit).map(c=>'<button type="button" class="verify-position" data-verify-position="'+String(c.boxId).replace(/"/g,'&quot;')+'"><img src="'+(c.crop||c.image||'')+'" onerror="this.classList.add(\'imgfail\')"><span><b>'+c.boxId+'</b><small>'+(c.capture||'')+' · '+(c.position||'')+'</small><em>Identifier ›</em></span></button>').join('')+'</div>'+(pending.length>verifyLimit?'<button class="loadmore" id="verifyMore">Afficher '+Math.min(30,pending.length-verifyLimit)+' de plus · '+(pending.length-verifyLimit)+' restantes</button>':'')+(pending.length?'':'<div class="empty">Tout est validé 🎉</div>');
}
function loadMoreVerify(){verifyLimit+=30;renderVerify()}
function bindVerifyV2(){
  document.addEventListener('input',e=>{if(e.target.id==='verifyFinder')verifySetQuery(e.target.value)});
  document.addEventListener('change',e=>{if(e.target.name==='verify-card')verifyChooseCard(e.target.value)});
  document.addEventListener('click',e=>{
    const p=e.target.closest?.('[data-verify-position]');if(p){e.preventDefault();verifySelectPosition(p.getAttribute('data-verify-position'));return}
    if(e.target.closest?.('#verifyConfirm')){e.preventDefault();verifyConfirm();return}
    if(e.target.closest?.('#verifySkip')){e.preventDefault();verifySkip();return}
    if(e.target.closest?.('#verifyCancel')){e.preventDefault();verifyCancel();return}
    if(e.target.closest?.('#verifyMore')){e.preventDefault();loadMoreVerify();return}
  });
}
bindVerifyV2();
function saveEdits(){
  try{
    return storageWrite('dokkanos-edits',JSON.stringify(DB.cards.filter(x=>x._edited).map(x=>({boxId:x.boxId,candidateId:x.candidateId,validated:x.validated,confidence:x.confidence,_edited:true}))));
  }catch(e){console.warn('DokkanOS: sauvegarde locale impossible',e);return false}
}

function skillText(v){if(!v)return '—';if(typeof v==='string')return v;if(Array.isArray(v))return v.map(skillText).join(' · ');return [v.name,v.description,v.condition].filter(Boolean).join(' — ')||'—'}
function tagBlock(title,arr){return arr?.length?`<section class="detail-section"><h3>${title}</h3><div class="tags">${arr.map(x=>`<span>${x}</span>`).join('')}</div></section>`:''}
function statsBlock(c){let vals=[['PV',c.maxHP||c.rainbowHP],['ATQ',c.maxATK||c.rainbowATK],['DEF',c.maxDEF||c.rainbowDEF],['Coût',c.cost],['Niv. max',c.maxLevel],['SP max',c.maxSALevel]].filter(x=>x[1]!==undefined&&x[1]!==null&&x[1]!=='');return vals.length?`<section class="detail-section"><h3>Statistiques</h3><div class="statline">${vals.map(([k,v])=>`<span><small>${k}</small><b>${Number(v).toLocaleString('fr-FR')}</b></span>`).join('')}</div></section>`:''}
function resolveCard(id){let c=DB.cards.find(x=>x.boxId===id);if(c)return c;if(String(id).startsWith('MANUAL-')){let cid=String(id).slice(7),m=localized(META.cards?.[cid]);if(!m)m=verifyCandidate(cid);if(m)return {boxId:id,candidateId:cid,confidence:'Confirmée manuellement',image:'assets/cards/'+cid+'.webp',validated:true,_manual:true,...m}}return null}
function openCard(id){
  let c=resolveCard(id);if(!c)return;let inTeam=selectedTeam.includes(id);
  let sa=skillText(c.superAttack),usa=skillText(c.ultraSuperAttack),trans=(c.transformations||[]).map(x=>x.name||x.id||x), active=skillText(c.active);
  $('#sheet').innerHTML=`<button onclick="closeSheet()" class="close">Fermer</button><div class="hero"><img src="${c.image}" onerror="imageFallback(this,'${c.candidateId}','')"><div><h2>${frCardName(c.name||'Carte '+(c.candidateId||'—'))}</h2><div>${c.title||''}</div><div class="card-badges"><span>${c.rarity||'—'}</span><span>${c.type||'—'}</span>${c.class?'<span>'+c.class+'</span>':''}${c.eza?'<span>EZA</span>':''}${rainbow100.has(String(c.candidateId))?'<span>🌈 Potentiel 100 %</span>':''}</div><p class="muted">ID ${c.candidateId||'—'} · ${c.confidence}</p><div class="detail-actions"><button class="primary" onclick="toggleTeam('${id}')">${inTeam?'Retirer de l’équipe':'Ajouter à l’équipe'}</button><button class="favorite-btn ${favorites.has(id)?'on':''}" onclick="toggleFavorite('${id}')">${favorites.has(id)?'★ Favori':'☆ Ajouter aux favoris'}</button><button class="favorite-btn ${rainbow100.has(String(c.candidateId))?'on':''}" onclick="toggleRainbowFromCard('${id}','${c.candidateId}')">${rainbow100.has(String(c.candidateId))?'🌈 Retirer le 100 %':'🌈 Marquer potentiel 100 %'}</button></div></div></div><section class="detail-section"><h3>Aptitude Leader</h3><p>${c.leader||'—'}</p></section><section class="detail-section"><h3>Passif${c.passiveName?' · '+c.passiveName:''}</h3><p>${skillText(c.passive)}</p></section><section class="detail-section"><h3>Attaque spéciale</h3><p>${sa}</p>${usa!=='—'?'<h4>Ultra attaque spéciale</h4><p>'+usa+'</p>':''}</section>${active!=='—'?'<section class="detail-section"><h3>Compétence active</h3><p>'+active+'</p></section>':''}${statsBlock(c)}${profileBlock(c)}${conditionBlock(c)}${tagBlock('Catégories',c.categories)}${tagBlock('Liens',c.links)}${trans.length?tagBlock('Transformations',trans):''}<section class="detail-section provenance"><small>Source des données : ${c.source?.provider||c.sources?.map(x=>x.provider).join(' + ')||'DokkanOS'} · Fiche ${c.fr?'française':'source'}</small></section>`;
  $('#sheet').classList.add('on')
}
function closeSheet(){$('#sheet').classList.remove('on')}
function toggleTeam(id){
  if(selectedTeam.includes(id))selectedTeam=selectedTeam.filter(x=>x!==id);else if(selectedTeam.length<6)selectedTeam.push(id);else return alert('Équipe complète : 6 cartes maximum.');
  storageWrite('dokkanos-team',JSON.stringify(selectedTeam));renderTeam();openCard(id);
}
function ownedTeamCards(){let seen=new Set(),out=[];DB.cards.filter(c=>c.validated&&c.candidateId).forEach(c=>{let id=String(c.candidateId);if(!seen.has(id)){seen.add(id);out.push(c)}});Object.entries(inventory).filter(([id,s])=>s==='owned'&&!seen.has(id)).forEach(([id])=>{let m=localized(META.cards?.[id])||verifyCandidate(id);if(m){seen.add(id);out.push({boxId:'MANUAL-'+id,candidateId:id,confidence:'Confirmée manuellement',image:localCardImage(id,m.image),validated:true,_manual:true,...m,name:frCardName(m.name||'')})}});return out}
function allKnownCategories(){return [...new Set(Object.values(META.cards||{}).flatMap(m=>(localized(m)?.categories)||[]))].sort((a,b)=>b.length-a.length)}
function leaderCategories(c){let text=norm(c?.leader||''),own=new Set(c?.categories||[]),hits=allKnownCategories().filter(x=>text.includes(norm(x)));return [...new Set([...hits,...[...own].filter(x=>text.includes(norm(x)))])]}
function leaderRule(c){let text=norm(c?.leader||''),cats=leaderCategories(c),types=['AGI','TEC','INT','PUI','END'].filter(t=>text.includes(norm(t))),classes=['Super','Extrême'].filter(k=>text.includes(norm(k))),all=text.includes('tous les types')||text.includes('all types');return {cats,types,classes,all,text}}

function leaderCoverageFor(leader,card){if(!leader||!card)return {covered:false,reasons:[]};let r=leaderRule(leader),reasons=[];for(let cat of r.cats)if((card.categories||[]).includes(cat))reasons.push(cat);if(r.all)reasons.push('Tous types');if(r.types.includes(card.type))reasons.push(card.type);if(r.classes.includes(card.class))reasons.push(card.class);return {covered:reasons.length>0,reasons:[...new Set(reasons)]}}
function sharedCount(a,b,key){let s=new Set(a?.[key]||[]);return (b?.[key]||[]).filter(x=>s.has(x)).length}
const ROLE_RULES=[
 ['Tank',/(reduction des degats|damage reduction|garde|guard|defense \+|def \+|defense augmente|raises def)/,14],
 ['Esquive',/(esquiv|dodge|evade)/,10],
 ['Stack DEF',/(augmente.*defense|raises def).*?(infini|continu|permanent|greatly raises def)/,12],
 ['Support',/(alli[eé]s|allies).*?(ki|atk|def|attaque|defense)/,12],
 ['Soin',/(recupere|restaure|recover|heal).*?(pv|hp)/,8],
 ['Critique',/(coup critique|critical hit|critique)/,7],
 ['Additionnelle',/(attaque supplementaire|additional attack)/,7],
 ['Ki',/(ki \+|ki de|ki +\d)/,5],
 ['Revive',/(revive|revival|reanimation)/,12],
 ['Standby',/(standby|mise en attente)/,9],
 ['Domaine',/(domain|domaine)/,9]
];
function kitText(c){return norm([skillText(c?.passive),skillText(c?.superAttack),skillText(c?.ultraSuperAttack),skillText(c?.active)].join(' '))}
function cardProfile(c){let text=kitText(c),roles=[];ROLE_RULES.forEach(([name,re,w])=>{if(re.test(text))roles.push({name,weight:w})});let offense=roles.filter(x=>['Critique','Additionnelle','Ki'].includes(x.name)).reduce((n,x)=>n+x.weight,0),defense=roles.filter(x=>['Tank','Esquive','Stack DEF','Soin'].includes(x.name)).reduce((n,x)=>n+x.weight,0),utility=roles.filter(x=>['Support','Revive','Standby','Domaine'].includes(x.name)).reduce((n,x)=>n+x.weight,0);return {roles,offense,defense,utility,score:offense+defense+utility}}
const CONDITION_RULES=[
 ['PV',/(pv|hp).{0,35}(%|inferieur|superieur|moins|plus)/],
 ['Slot',/(1er|2e|3e|premier|deuxieme|troisieme|position|slot)/],
 ['Tours',/(pendant|a partir|tour|turn).{0,25}[0-9]/],
 ['Attaques reçues',/(attaque.{0,15}recue|receives an attack|apres avoir recu)/],
 ['Attaques lancées',/(attaque.{0,20}(effectuee|lancee)|after attacking|super attack performed)/],
 ['Allié requis',/(allie|ally).{0,45}(categorie|category|nom|name|equipe|team)/],
 ['Ennemi requis',/(ennemi|enemy).{0,45}(categorie|category|type|classe|class)/],
 ['Ki',/(ki).{0,20}(egal|superieur|inferieur|orbe|sphere)/],
 ['Transformation',/(transform|transformation).{0,45}(condition|lorsque|when|tour|turn)/]
];
function conditionProfile(c){let text=kitText(c),conditions=CONDITION_RULES.filter(([,re])=>re.test(text)).map(([name])=>name),conditionalSignals=(text.match(/(si |lorsque|quand|a condition|avec |pour chaque|apres |avant |when |if |after |with )/g)||[]).length,reliability=Math.max(35,100-conditions.length*8-Math.min(25,conditionalSignals*3));return {conditions:[...new Set(conditions)],signals:conditionalSignals,reliability}}
function intelligenceProfile(c){let p=cardProfile(c),cond=conditionProfile(c);return {...p,...cond}}
function conditionBlock(c){let p=conditionProfile(c);return `<section class="detail-section"><h3>Conditions détectées</h3>${p.conditions.length?`<div class="tags condition-tags">${p.conditions.map(x=>`<span>${x}</span>`).join('')}</div>`:'<p class="muted">Aucune contrainte majeure détectée automatiquement.</p>'}<p class="muted">Disponibilité structurelle estimée : ${p.reliability}/100. Cette valeur mesure la dépendance aux conditions, pas la puissance de la carte.</p></section>`}
function roleNames(c){return cardProfile(c).roles.map(x=>x.name)}
function teamRoleBalance(team){let profiles=team.map(cardProfile),names=profiles.flatMap(x=>x.roles.map(r=>r.name)),has=n=>names.includes(n),def=team.filter(x=>{let p=cardProfile(x);return p.defense>=10}).length,support=team.filter(x=>roleNames(x).includes('Support')).length,off=team.filter(x=>{let p=cardProfile(x);return p.offense>=7}).length;let score=Math.min(100,def*18+Math.min(20,support*10)+Math.min(20,off*7)+(has('Soin')?8:0)+(has('Revive')?8:0));return {score,def,support,off,names:[...new Set(names)]}}
function profileBlock(c){let p=cardProfile(c);return p.roles.length?`<section class="detail-section"><h3>Profil DokkanOS</h3><div class="tags role-tags">${p.roles.map(x=>`<span>${x.name}</span>`).join('')}</div><p class="muted">Profil détecté automatiquement à partir des aptitudes de la carte.</p></section>`:''}
function candidateScore(card,leader,team){let cov=leaderCoverageFor(leader,card),links=team.reduce((n,x)=>n+sharedCount(card,x,'links'),0),cats=team.reduce((n,x)=>n+sharedCount(card,x,'categories'),0),rar={LR:8,UR:5,SSR:2}[card.rarity]||0,eza=card.eza?3:0,profile=intelligenceProfile(card),balance=teamRoleBalance(team),needDefense=balance.def<2&&profile.defense>=10?12:0,needSupport=balance.support<1&&roleNames(card).includes('Support')?10:0;return {score:(cov.covered?70:0)+links*5+cats*2+rar+eza+Math.min(18,profile.score)+Math.round((profile.reliability-70)/10)+needDefense+needSupport,coverage:cov,links,cats,profile}}
function pairScore(a,b){return sharedCount(a,b,'links')*8+sharedCount(a,b,'categories')*2}
function teamMetrics(cards,leader){let pairs=[],totalLinks=0,totalCats=0;for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){let l=sharedCount(cards[i],cards[j],'links'),ca=sharedCount(cards[i],cards[j],'categories');totalLinks+=l;totalCats+=ca;pairs.push({a:cards[i],b:cards[j],links:l,cats:ca,score:l*8+ca*2})}pairs.sort((x,y)=>y.score-x.score);let covered=leader?cards.filter(x=>leaderCoverageFor(leader,x).covered).length:0,score=Math.round((cards.length?covered/cards.length*55:0)+Math.min(25,totalLinks*2)+Math.min(15,totalCats*.5)+(cards.filter(x=>x.eza).length?5:0));let roles=teamRoleBalance(cards);score=Math.round(score*.75+roles.score*.25);return {pairs,totalLinks,totalCats,covered,roles,score:Math.min(100,score)}}
function bestRotations(cards){let pairs=[];for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)pairs.push({a:cards[i],b:cards[j],score:pairScore(cards[i],cards[j]),links:sharedCount(cards[i],cards[j],'links')});pairs.sort((a,b)=>b.score-a.score);let used=new Set(),out=[];for(let p of pairs){if(!used.has(p.a.boxId)&&!used.has(p.b.boxId)){out.push(p);used.add(p.a.boxId);used.add(p.b.boxId);if(out.length===2)break}}return out}
function teamIntelligence(team,leader){let profiles=team.map(intelligenceProfile),avg=profiles.length?Math.round(profiles.reduce((n,p)=>n+p.reliability,0)/profiles.length):0,conditional=profiles.filter(p=>p.conditions.length>=2).length,slot=profiles.filter(p=>p.conditions.includes('Slot')).length,hp=profiles.filter(p=>p.conditions.includes('PV')).length,warnings=[];if(leader&&team.some(c=>!leaderCoverageFor(leader,c).covered))warnings.push('Une ou plusieurs unités ne profitent pas du Aptitude Leader.');if(slot>=3)warnings.push('Plusieurs kits dépendent du placement : les rotations peuvent être contraintes.');if(conditional>=4)warnings.push('Équipe très conditionnelle : ses performances peuvent varier fortement selon le combat.');if(teamRoleBalance(team).def<2&&team.length>=5)warnings.push('Peu de profils défensifs détectés.');return {avg,conditional,slot,hp,warnings}}
function explainCandidate(card,leader,team){let s=candidateScore(card,leader,team),bits=[];if(s.coverage.covered)bits.push('Leader ✓');if(s.links)bits.push(s.links+' liens');if(s.profile.roles.length)bits.push(s.profile.roles.slice(0,2).map(x=>x.name).join('/'));if(s.profile.conditions.length)bits.push(s.profile.conditions.length+' condition(s)');bits.push('dispo '+s.profile.reliability+'/100');return bits.join(' · ')}
function autoBuildTeam(){let leader=teamLeader?resolveCard(teamLeader):null;if(!leader)return alert('Choisis d’abord un leader.');let pool=ownedTeamCards().filter(x=>x.boxId!==teamLeader),team=[leader];while(team.length<6){let candidates=pool.filter(x=>!team.some(t=>t.boxId===x.boxId)).map(x=>({card:x,...candidateScore(x,leader,team)})).sort((a,b)=>b.score-a.score);let best=candidates.find(x=>x.coverage.covered)||candidates[0];if(!best)break;team.push(best.card)}selectedTeam=team.map(x=>x.boxId);storageWrite('dokkanos-team',JSON.stringify(selectedTeam));renderTeam()}
function cardTeamDiagnostic(card,leader,team){let cov=leaderCoverageFor(leader,card),others=team.filter(x=>x.boxId!==card.boxId),best=others.map(x=>({card:x,links:sharedCount(card,x,'links'),cats:sharedCount(card,x,'categories'),score:pairScore(card,x)})).sort((a,b)=>b.score-a.score)[0],flags=[];if(leader&&!cov.covered)flags.push('Hors Aptitude Leader');if(!best||best.links===0)flags.push('Aucun lien actif détecté');if(card.eza)flags.push('EZA');return {cov,best,flags}}
function replacementFor(card,leader,team){let pool=ownedTeamCards().filter(x=>!team.some(t=>t.boxId===x.boxId)),current=candidateScore(card,leader,team.filter(x=>x.boxId!==card.boxId)).score;let alt=pool.map(x=>({card:x,...candidateScore(x,leader,team.filter(t=>t.boxId!==card.boxId))})).filter(x=>x.coverage.covered&&x.score>current).sort((a,b)=>b.score-a.score)[0];return alt||null}
function teamDiagnostics(team,leader){if(!team.length)return'';return `<div class="team-insights"><h3>Diagnostic des unités</h3>${team.map(c=>{let d=cardTeamDiagnostic(c,leader,team),rep=replacementFor(c,leader,team);return `<div class="unit-diagnostic ${leader&&!d.cov.covered?'warn':''}"><img src="${c.image}"><div><b>${c.name||c.candidateId}</b><small>${d.cov.covered?'✓ Leader : '+d.cov.reasons.join(', '):leader?'⚠ Hors Aptitude Leader':'Leader non défini'}</small><p>${d.best?'Meilleure paire : '+(d.best.card.name||d.best.card.candidateId)+' · '+d.best.links+' lien(s)':'Aucune paire'}${rep?' · Remplacement structurel possible : '+(rep.card.name||rep.card.candidateId):''}</p></div></div>`}).join('')}</div>`}
function autoExplanation(team,leader){if(!leader||team.length<2)return'';return `<div class="team-insights"><h3>Pourquoi cette composition ?</h3>${team.map((c,i)=>{let d=candidateScore(c,leader,team.filter(x=>x.boxId!==c.boxId));return `<div class="row"><span>${i===0?'Leader · ':''}${c.name||c.candidateId}</span><b>${d.coverage.covered?'Couvert':'Hors leader'} · ${d.links} liens</b></div>`}).join('')}<p class="muted">Le classement privilégie la couverture du Aptitude Leader puis les liens et catégories partagés. Il ne représente pas encore les performances en combat tour par tour.</p></div>`}
function initLeaderSelect(){let el=$('#leaderSelect');if(!el)return;let cards=ownedTeamCards().filter(c=>c.leader).sort((a,b)=>(a.name||'').localeCompare(b.name||'','fr'));el.innerHTML='<option value="">Choisir le leader</option>'+cards.map(c=>`<option value="${c.boxId}" ${teamLeader===c.boxId?'selected':''}>${c.name||c.candidateId} · ${c.rarity||''}</option>`).join('')}
function addCandidate(id){if(selectedTeam.includes(id))return;if(selectedTeam.length>=6)return alert('Équipe complète : 6 cartes maximum.');selectedTeam.push(id);storageWrite('dokkanos-team',JSON.stringify(selectedTeam));renderTeam()}
function clearTeam(){selectedTeam=[];storageWrite('dokkanos-team','[]');renderTeam()}
function removeFromTeam(id){selectedTeam=selectedTeam.filter(x=>x!==id);storageWrite('dokkanos-team',JSON.stringify(selectedTeam));renderTeam()}
function commonValues(cards,key){if(cards.length<2)return[];let count={};cards.forEach(c=>new Set(c[key]||[]).forEach(v=>count[v]=(count[v]||0)+1));return Object.entries(count).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,8)}
function teamInsights(){let cards=selectedTeam.map(resolveCard).filter(Boolean),cats=commonValues(cards,'categories'),links=commonValues(cards,'links');if(!cards.length)return '<p class="muted">Ajoute des cartes pour analyser les synergies.</p>';return `<div class="team-insights"><h3>Synergies détectées</h3><p class="muted">${cards.filter(c=>c.name||c.categories?.length||c.links?.length).length}/${cards.length} cartes avec données enrichies</p>${cats.length?`<h4>Catégories communes</h4><div class="tags">${cats.map(([x,n])=>`<span>${x} · ${n}</span>`).join('')}</div>`:''}${links.length?`<h4>Liens communs</h4><div class="tags">${links.map(([x,n])=>`<span>${x} · ${n}</span>`).join('')}</div>`:''}${!cats.length&&!links.length?'<p class="muted">Les synergies apparaîtront automatiquement à mesure que les fiches seront enrichies.</p>':''}</div>`}
function toggleRainbow100(id){id=String(id);rainbow100.has(id)?rainbow100.delete(id):rainbow100.add(id);storageWrite('dokkanos-rainbow100',JSON.stringify([...rainbow100]));renderDuplicates();render();renderManualOwned()}
function toggleRainbowFromCard(boxId,candidateId){toggleRainbow100(candidateId);openCard(boxId)}
function changePotentialDuplicate(id,delta){id=String(id);let current=Math.max(0,Math.min(4,Number(potentialManual[id]||0))),next=Math.max(0,Math.min(4,current+delta));if(next)potentialManual[id]=next;else delete potentialManual[id];storageWrite('dokkanos-potential-manual',JSON.stringify(potentialManual));renderDuplicates()}
function renderDuplicates(){
  let el=$('#duplicateList');if(!el)return;
  let owned={};DB.cards.filter(c=>c.validated&&c.candidateId).forEach(c=>(owned[String(c.candidateId)]??=[]).push(c));
  let families=canonicalPotentialFamilies(), seen=new Set(), rows=[];
  families.forEach(entry=>{let family=entry.family,preferred=entry.card,id=String(preferred.id),ids=family.map(c=>String(c.id)),copies=ids.flatMap(x=>owned[x]||[]);ids.forEach(x=>seen.add(x));let manual=Math.max(0,...ids.map(x=>Number(potentialManual[x]||0))),rainbow=ids.some(x=>rainbow100.has(x)),auto=Math.min(4,Math.max(0,copies.length-1)),dupes=Math.max(auto,Math.min(4,manual)),ready=dupes>=4;rows.push({id,c:preferred,copies,dupes,rainbow,ready,familyIds:ids})});
  Object.entries(owned).forEach(([id,copies])=>{if(seen.has(id))return;let c=copies[0];if(!['UR','LR'].includes(String(c.rarity||'').toUpperCase()))return;let auto=Math.min(4,copies.length-1),dupes=Math.max(auto,Math.min(4,Number(potentialManual[id]||0)));rows.push({id,c,copies,dupes,rainbow:rainbow100.has(id),ready:dupes>=4})});
  rows.sort((a,b)=>Number(b.rainbow)-Number(a.rainbow)||b.dupes-a.dupes||frCardName(a.c.name||'').localeCompare(frCardName(b.c.name||''),'fr'));
  let ownedCount=rows.filter(x=>x.copies.length).length, rainbowCount=rows.filter(x=>x.rainbow).length;
  $('#dupCount').textContent=rows.length+' cartes';let summary=$('#duplicateSummary');if(summary)summary.textContent=rows.length+' cartes UR/LR · '+ownedCount+' possédées · '+rainbowCount+' à 100 %';
  el.innerHTML=rows.map(x=>{let img=x.copies[0]?.image||x.c.image||localCardImage(x.id,''),name=frCardName(x.copies[0]?.name||x.c.name||'ID '+x.id),dots=[1,2,3,4].map(n=>`<i class="${x.dupes>=n?'filled':''}"></i>`).join(''),state=x.rainbow?'🌈 100 %':x.copies.length?(x.ready?'4/4':' '+x.dupes+'/4'):'Non possédée',boxId=x.copies[0]?.boxId;return `<div class="potential-line ${x.copies.length?'owned':'unowned'}" ${boxId?`onclick="openCard('${boxId}')"`:''}><img loading="lazy" src="${img}" onerror="imageFallback(this,'${x.id}','${img}')"><div class="potential-line-main"><b>${name}</b><div class="potential-meter">${dots}</div></div><span class="potential-state ${x.rainbow?'rainbow':x.ready?'ready':''}">${state}</span><div class="potential-stepper"><button onclick="event.stopPropagation();changePotentialDuplicate('${x.id}',-1)">−</button><b>${x.dupes}</b><button onclick="event.stopPropagation();changePotentialDuplicate('${x.id}',1)">+</button></div>${x.ready||x.rainbow?`<button class="potential-100" onclick="event.stopPropagation();toggleRainbow100('${x.id}')">${x.rainbow?'✓':'100 %'}</button>`:''}</div>`}).join('')||'<div class="empty">Catalogue indisponible.</div>'
}
function catalogSelectable(c){return ['SSR','UR','LR'].includes(c.rarity)}
let CACHED_FAMILIES=null, CACHED_FAMILY_BY_ID=null;
function catalogFamilies(){
  if(CACHED_FAMILIES)return CACHED_FAMILIES;
  const cards=(CATALOG.cards||[]).filter(catalogSelectable), byId=new Map(cards.map(c=>[String(c.id),c])), parent=new Map(cards.map(c=>[String(c.id),String(c.id)]));
  const root=id=>{id=String(id);if(!parent.has(id))return id;let p=parent.get(id);while(p!==parent.get(p))p=parent.get(p);return p};
  for(const c of cards){let from=String(c.id),to=String(c.awakensTo||'');if(to&&byId.has(to)){let a=root(from),b=root(to);if(a!==b)parent.set(a,b)}}
  const groups=new Map();for(const c of cards){let key=root(c.id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}
  const rank={LR:4,UR:3,SSR:2,SR:1};
  CACHED_FAMILIES=[...groups.values()].map(group=>{group.sort((a,b)=>(rank[b.rarity]||0)-(rank[a.rarity]||0)||Number(b.id)-Number(a.id));return group});
  CACHED_FAMILY_BY_ID=new Map(CACHED_FAMILIES.flatMap(group=>group.map(card=>[String(card.id),group])));
  return CACHED_FAMILIES
}
function familyFor(id){catalogFamilies();return CACHED_FAMILY_BY_ID.get(String(id))||[{id:String(id)}]}
function canonicalPotentialFamilies(){
  const groups=catalogFamilies(), out=[], seen=new Set();
  for(const family of groups){
    const eligible=family.filter(c=>['UR','LR'].includes(String(c.rarity||'').toUpperCase()));if(!eligible.length)continue;
    const rank={LR:2,UR:1},max=Math.max(...eligible.map(c=>rank[String(c.rarity||'').toUpperCase()]||0));
    const finals=eligible.filter(c=>(rank[String(c.rarity||'').toUpperCase()]||0)===max);
    for(const c of finals){
      const name=norm(bestFrenchName({id:c.id,name:c.name},c)).replace(/\[[^\]]*\]|\([^)]*\)/g,'').replace(/\b(super|extreme|teq|agl|int|str|phy)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();
      const key=[String(c.rarity||'').toUpperCase(),String(c.type||''),name].join('|');
      if(seen.has(key))continue;seen.add(key);out.push({family,card:c});
    }
  }
  return out
}
function familyState(group){
  const ids=group.map(c=>String(c.id));
  if(ids.some(id=>capturedOwned(id)||inventory[id]==='owned'))return 'owned';
  if(ids.some(id=>inventory[id]==='missing'))return 'missing';
  return 'review'
}
function familyCard(group){return group.find(c=>capturedOwned(c.id)||inventory[String(c.id)]==='owned')||group[0]}
function renderMissing(){let el=$('#missingList');if(!el)return;let q=norm(missingQuery),all=catalogFamilies().filter(group=>familyState(group)!=='owned').map(group=>({card:familyCard(group),state:familyState(group)})).filter(({card})=>!q||norm(`${card.id} ${card.name} ${card.title} ${card.rarity} ${card.type}`).includes(q)),a=all.slice(0,300);$('#missingCount').textContent=all.length+(all.length>300?' · 300 affichées':'');el.innerHTML=a.map(({card:c,state})=>`<article class="unit"><img loading="lazy" src="${c.image||''}" onerror="imageFallback(this,'${c.id}','')"><div class="meta"><strong>${frCardName(c.name||'ID '+c.id)}</strong><small>${c.rarity||''} · ${c.type||''} · ${state==='missing'?'Non possédée':'À confirmer'}</small></div></article>`).join('')||'<div class="empty">Aucune carte à confirmer pour cette recherche.</div>'}
function capturedOwned(id){return DB.cards.some(c=>c.validated&&String(c.candidateId)===String(id))}
function inventoryState(card){return familyState(familyFor(card.id||card.candidateId||''))}
function ownedIds(){let s=new Set(DB.cards.filter(c=>c.validated&&c.candidateId).map(c=>String(c.candidateId)));Object.entries(inventory).forEach(([id,state])=>{if(state==='owned')s.add(id)});return s}
function setInventory(id,state){id=String(id);let family=familyFor(id);if(state==='missing'&&family.some(c=>capturedOwned(c.id))){alert('Une forme de cette unité est déjà confirmée dans tes captures. Corrige d’abord son identification dans « À vérifier » si nécessaire.');return}for(const c of family)delete inventory[String(c.id)];if(state!=='review')inventory[id]=state;storageWrite('dokkanos-inventory',JSON.stringify(inventory));renderInventory();renderMissing();renderManualOwned();renderDuplicates();stats();renderAnalysis();initAdvancedFilters();renderTeam()}
function renderInventory(){let el=$('#inventoryList');if(!el)return;let groups=catalogFamilies(),base=groups.map(familyCard);if(!base.length)base=Object.entries(META.cards||{}).map(([id,c])=>({id,name:frCardName(c.fr?.name||c.name),title:c.fr?.title||c.title,rarity:c.rarity,type:c.fr?.type||c.type,image:'assets/cards/'+id+'.webp'}));let q=norm(inventoryQuery),all=base.filter(c=>(inventoryFilter==='all'?true:inventoryState(c)===inventoryFilter)&&(!q||norm(`${c.id} ${c.name} ${c.title} ${c.rarity} ${c.type}`).includes(q))),a=all.slice(0,300);$('#inventoryCount').textContent=all.length+(all.length>300?' · 300 affichées':'');el.innerHTML=a.map(c=>{let id=String(c.id||''),st=inventoryState(c);return `<div class="panel inventory-row"><img src="${c.image||('assets/cards/'+id+'.webp')}" onerror="imageFallback(this,'${id}','')"><div class="inventory-info"><b>${frCardName(c.name||'ID '+id)}</b><small>${c.rarity||''} · ${c.type||''} · ID ${id}</small><div class="inventory-actions"><button class="${st==='owned'?'selected':''}" onclick="setInventory('${id}','owned')">✓ Je possède</button><button class="${st==='missing'?'selected':''}" onclick="setInventory('${id}','missing')">✕ Non</button><button class="${st==='review'?'selected':''}" onclick="setInventory('${id}','review')">? À vérifier</button></div></div></div>`}).join('')||'<div class="empty">Aucune carte dans ce filtre.</div>'}
function openMetaCard(id){openCard('MANUAL-'+id)}
function renderManualOwned(){let el=$('#manualOwned');if(!el)return;let ids=Object.entries(inventory).filter(([id,s])=>s==='owned'&&!capturedOwned(id)).map(([id])=>id),cards=ids.map(id=>{let m=localized(META.cards?.[id])||{},cat=(CATALOG.cards||[]).find(x=>String(x.id)===id)||{};return {id,boxId:'MANUAL-'+id,validated:true,...cat,...m,name:frCardName(m.name||cat.name||''),categories:frList(m.categories||cat.categories),links:frList(m.links||cat.links),image:localCardImage(id,cat.image||m.image)}}).filter(cardMatchesFilters);el.innerHTML=cards.map(x=>`<article class="unit manual-owned" onclick="openMetaCard('${x.id}')"><i class="dot manual"></i>${favorites.has('MANUAL-'+x.id)?'<b class="favmark">★</b>':''}${rainbow100.has(String(x.id))?'<b class="rainbowmark" title="Potentiel 100 %">🌈 100 %</b>':''}<img loading="lazy" src="${x.image}" onerror="imageFallback(this,'${x.id}','')"><div class="meta"><strong>${frCardName(x.name||'ID '+x.id)}</strong><small>${x.rarity||''} · confirmé manuellement</small></div></article>`).join('');$('#manualOwnedTitle').style.display=cards.length?'flex':'none'}
function renderTeam(){
  let el=$('#teamSlots');if(!el)return;initLeaderSelect();
  let leader=teamLeader?resolveCard(teamLeader):null,team=selectedTeam.map(resolveCard).filter(Boolean);
  el.innerHTML=[0,1,2,3,4,5].map(i=>{let id=selectedTeam[i],c=resolveCard(id);return c?`<button class="slot filled" onclick="openCard('${id}')"><img src="${c.image}"><small>${c.name||c.candidateId}</small><i onclick="event.stopPropagation();removeFromTeam(\'${id}\')">×</i></button>`:`<div class="slot"><b>+</b><small>Slot ${i+1}</small></div>`}).join('');
  $('#teamCount').textContent=selectedTeam.length+'/6';let ins=$('#teamInsights');if(ins)ins.innerHTML=teamInsights();
  let metrics=teamMetrics(team,leader),intel=teamIntelligence(team,leader),scoreEl=$('#teamScore');if(scoreEl)scoreEl.innerHTML=team.length?`<div class="team-score"><div><small>Cohérence structurelle</small><b>${metrics.score}/100</b></div><div><small>Couverture Leader</small><b>${metrics.covered}/${team.length}</b></div><div><small>Liens partagés</small><b>${metrics.totalLinks}</b></div><div><small>Équilibre des rôles</small><b>${metrics.roles.score}/100</b></div><div><small>Disponibilité des kits</small><b>${intel.avg}/100</b></div></div>`:'';
  let rolePanel=document.querySelector('#teamRoles');if(!rolePanel){rolePanel=document.createElement('div');rolePanel.id='teamRoles';$('#teamScore').after(rolePanel)}rolePanel.innerHTML=team.length?`<div class="team-insights"><h3>Équilibre de l’équipe</h3><div class="tags role-tags">${metrics.roles.names.map(x=>`<span>${x}</span>`).join('')}</div><div class="row"><span>Unités défensives détectées</span><b>${metrics.roles.def}</b></div><div class="row"><span>Supports détectés</span><b>${metrics.roles.support}</b></div><div class="row"><span>Profils offensifs détectés</span><b>${metrics.roles.off}</b></div></div>`:'';
  let rot=$('#rotations'),rots=bestRotations(team);if(rot)rot.innerHTML=rots.length?`<div class="team-insights"><h3>Rotations suggérées</h3>${rots.map((p,i)=>`<div class="rotation-row"><b>Rotation ${i+1}</b><span>${p.a.name||p.a.candidateId} + ${p.b.name||p.b.candidateId}</span><small>${p.links} lien(s) commun(s)</small></div>`).join('')}</div>`:'';

  let intelEl=document.querySelector('#teamIntelligence');if(!intelEl){intelEl=document.createElement('div');intelEl.id='teamIntelligence';$('#teamRoles').after(intelEl)}intelEl.innerHTML=team.length?`<div class="team-insights"><h3>Lecture intelligente</h3><div class="row"><span>Unités très conditionnelles</span><b>${intel.conditional}</b></div><div class="row"><span>Dépendances de placement</span><b>${intel.slot}</b></div>${intel.warnings.map(x=>`<p class="ai-warning">⚠ ${x}</p>`).join('')||'<p class="ai-ok">✓ Aucun déséquilibre structurel majeur détecté.</p>'}</div>`:'';
  let diag=document.querySelector('#teamDiagnostics');if(!diag){diag=document.createElement('div');diag.id='teamDiagnostics';$('#rotations').after(diag)}diag.innerHTML=teamDiagnostics(team,leader)+autoExplanation(team,leader);
  let cover=$('#leaderCoverage');if(cover)cover.innerHTML=leader?`<div class="leader-card"><img src="${leader.image}"><div><small>Leader sélectionné</small><b>${leader.name||leader.candidateId}</b><p>${leader.leader||'Aptitude Leader indisponible'}</p></div></div>`:'<div class="empty compact">Choisis un leader pour calculer la couverture de l’équipe.</div>';
  let cand=$('#teamCandidates');if(cand){let rows=ownedTeamCards().filter(x=>!selectedTeam.includes(x.boxId)&&x.boxId!==teamLeader).map(x=>({card:x,...candidateScore(x,leader,team)})).sort((a,b)=>b.score-a.score).slice(0,30);cand.innerHTML=rows.map(x=>`<div class="candidate-row ${x.coverage.covered?'covered':'uncovered'}"><img src="${x.card.image}"><div><b>${x.card.name||x.card.candidateId}</b><small>${x.card.rarity||''} · ${x.card.type||''}</small><p>${leader?explainCandidate(x.card,leader,team):'Sélectionne un leader'}</p></div><button onclick="addCandidate('${x.card.boxId}')">+</button></div>`).join('')||'<div class="empty">Aucun candidat.</div>'}
}
function countBy(cards,key){let o={};cards.forEach(c=>{let v=c[key];if(v)o[v]=(o[v]||0)+1});return Object.entries(o).sort((a,b)=>b[1]-a[1])}
function topMulti(cards,key,n=12){let o={};cards.forEach(c=>(c[key]||[]).forEach(v=>o[v]=(o[v]||0)+1));return Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n)}
function synergyReadiness(cards){let withCats=cards.filter(c=>c.categories?.length).length,withLinks=cards.filter(c=>c.links?.length).length,leaders=cards.filter(c=>c.leader).length;return {withCats,withLinks,leaders,ready:cards.length?Math.round(((withCats+withLinks+leaders)/(cards.length*3))*100):0}}
function collectionWarnings(valid,manualIds){let out=[],captured=new Set(valid.map(c=>String(c.candidateId)));for(const [id,state] of Object.entries(inventory)){if(state==='missing'&&captured.has(id))out.push('Conflit inventaire sur ID '+id)}let unresolved=(OVERLAP.conflicts||[]).filter(x=>x.status!=='resolved').length;if(unresolved)out.push(unresolved+' conflit(s) de chevauchement encore à vérifier');let noMeta=valid.filter(c=>!c.name&&!c.title).length;if(noMeta)out.push(noMeta+' position(s) validée(s) sans fiche enrichie');return out}
function bars(title,rows,total){return `<div class="panel collection-panel"><h3>${title}</h3>${rows.map(([k,n])=>`<div class="metric-row"><div><span>${k}</span><b>${n}</b></div><div class="metric-track"><i style="width:${Math.max(2,Math.round(n/Math.max(1,total)*100))}%"></i></div></div>`).join('')||'<p class="muted">Pas encore de données.</p>'}</div>`}
function renderAnalysis(){
  let el=$('#analysisContent');if(!el)return;
  let valid=DB.cards.filter(c=>c.validated&&c.candidateId),manualIds=Object.entries(inventory).filter(([,s])=>s==='owned').map(([id])=>id),seen=new Set(),owned=[];
  valid.forEach(c=>{let id=String(c.candidateId);if(!seen.has(id)){seen.add(id);owned.push(c)}});
  manualIds.forEach(id=>{if(seen.has(id))return;let m=localized(META.cards?.[id])||verifyCandidate(id);if(m){seen.add(id);owned.push({candidateId:id,...m})}});
  let copies={};valid.forEach(c=>copies[c.candidateId]=(copies[c.candidateId]||0)+1);let duplicateCopies=Object.values(copies).reduce((n,x)=>n+Math.max(0,x-1),0);
  let conf={};DB.cards.forEach(c=>conf[c.confidence]=(conf[c.confidence]||0)+1);
  let rarity=countBy(owned,'rarity'),types=countBy(owned,'type'),classes=countBy(owned,'class'),cats=topMulti(owned,'categories'),links=topMulti(owned,'links');
  let eza=owned.filter(c=>c.eza).length,lr=owned.filter(c=>c.rarity==='LR').length,fav=[...favorites].filter(id=>DB.cards.some(c=>c.boxId===id)||(String(id).startsWith('MANUAL-')&&inventory[String(id).slice(7)]==='owned')).length,review=DB.cards.filter(c=>!c.validated).length,synergy=synergyReadiness(owned),warnings=collectionWarnings(valid,manualIds);
  el.innerHTML=`<div class="collection-kpis"><div><b>${owned.length}</b><span>cartes uniques possédées</span></div><div><b>${lr}</b><span>LR</span></div><div><b>${eza}</b><span>EZA</span></div><div><b>${duplicateCopies}</b><span>copies en doublon</span></div><div><b>${fav}</b><span>favoris</span></div><div><b>${review}</b><span>positions à vérifier</span></div></div><div class="analysis-grid">${bars('Raretés',rarity,owned.length)}${bars('Types',types,owned.length)}${bars('Classes',classes,owned.length)}<div class="panel collection-panel"><h3>Origine de l’inventaire</h3><div class="row"><span>Confirmées depuis les captures</span><b>${new Set(valid.map(c=>String(c.candidateId))).size}</b></div><div class="row"><span>Ajouts manuels uniques</span><b>${manualIds.filter(id=>!new Set(valid.map(c=>String(c.candidateId))).has(id)).length}</b></div><div class="row"><span>Progression de validation</span><b>${Math.round((DB.cards.length-review)/Math.max(1,DB.cards.length)*100)}%</b></div></div></div><div class="panel"><h3>Catégories les plus représentées</h3><div class="rank-grid">${cats.map(([x,n])=>`<button onclick="useCollectionFilter('category','${String(x).replace(/'/g,"\\'")}')"><span>${x}</span><b>${n}</b></button>`).join('')}</div></div><div class="panel"><h3>Liens les plus représentés</h3><div class="rank-grid">${links.map(([x,n])=>`<button onclick="useCollectionFilter('link','${String(x).replace(/'/g,"\\'")}')"><span>${x}</span><b>${n}</b></button>`).join('')}</div></div><div class="panel"><h3>Préparation du moteur d’équipes</h3><div class="row"><span>Fiches avec catégories</span><b>${synergy.withCats}/${owned.length}</b></div><div class="row"><span>Fiches avec liens</span><b>${synergy.withLinks}/${owned.length}</b></div><div class="row"><span>Aptitude Leaders disponibles</span><b>${synergy.leaders}/${owned.length}</b></div><div class="readiness"><i style="width:${synergy.ready}%"></i></div><p class="muted">Données de synergie prêtes à ${synergy.ready}%.</p></div>${warnings.length?`<div class="panel warning-panel"><h3>Contrôles restants</h3>${warnings.map(x=>`<div class="row"><span>${x}</span><b>À vérifier</b></div>`).join('')}</div>`:'<div class="panel success-panel"><h3>Contrôle collection</h3><p>✓ Aucun conflit structurel détecté.</p></div>'}<div class="panel"><h3>Qualité des identifications</h3>${Object.entries(conf).map(([k,v])=>`<div class="row"><span><i class="legend ${confClass(k)}"></i>${k}</span><b>${v}</b></div>`).join('')}</div>`;
}
function useCollectionFilter(kind,value){if(kind==='category'){categoryFilter=value;$('#categoryFilter').value=value}else{linkFilter=value;$('#linkFilter').value=value}switchView('box');render()}
function switchView(v){if(!document.getElementById(v)?.classList.contains('view'))return;$$('.view').forEach(x=>x.classList.remove('on'));$('#'+v).classList.add('on');document.body.dataset.view=v;$$('nav button').forEach(x=>{const active=x.dataset.v===v;x.classList.toggle('on',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});if(v==='duplicates')renderDuplicates();if(v==='inventory')renderInventory();if(v==='catalog')renderMissing();if(v==='teams')renderTeam();if(v==='events')renderEvents();if(v==='analysis')renderAnalysis();window.dispatchEvent?.(new window.Event('dokkanos-view-change'));window.scrollTo?.({top:0,behavior:'auto'});let active=document.querySelector('nav button.on');if(active)active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}
document.addEventListener('click',e=>{if(e.target.id==='resetFilters'){query='';filter='all';$('#search').value='';$$('.chip').forEach(x=>x.classList.toggle('on',x.dataset.f==='all'));rarityFilter=typeFilter=classFilter=categoryFilter=linkFilter=ezaFilter='';favoriteOnly=false;['rarityFilter','typeFilter','classFilter','categoryFilter','linkFilter','ezaFilter'].forEach(id=>$('#'+id).value='');$('#favoriteFilter').classList.remove('on');render()}if(e.target.id==='favoriteFilter'){favoriteOnly=!favoriteOnly;e.target.classList.toggle('on',favoriteOnly);render()}if(e.target.matches('.invchip')){$$('.invchip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');inventoryFilter=e.target.dataset.invf;renderInventory()}if(e.target.matches('.chip')){$$('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');filter=e.target.dataset.f;render()}if(e.target.id==='autoTeam')autoBuildTeam();if(e.target.id==='clearTeam')clearTeam();const nav=e.target.closest?.('nav button');if(nav)switchView(nav.dataset.v)});
document.addEventListener('input',e=>{if(e.target.id==='search'){query=norm(e.target.value);render()}if(e.target.id==='inventorySearch'){inventoryQuery=e.target.value;renderInventory()}});
document.addEventListener('change',e=>{
  let refreshBox=false;
  if(e.target.id==='sort'){sortMode=e.target.value;refreshBox=true}
  if(e.target.id==='rarityFilter'){rarityFilter=e.target.value;refreshBox=true}
  if(e.target.id==='typeFilter'){typeFilter=e.target.value;refreshBox=true}
  if(e.target.id==='classFilter'){classFilter=e.target.value;refreshBox=true}
  if(e.target.id==='categoryFilter'){categoryFilter=e.target.value;refreshBox=true}
  if(e.target.id==='linkFilter'){linkFilter=e.target.value;refreshBox=true}
  if(e.target.id==='ezaFilter'){ezaFilter=e.target.value;refreshBox=true}
  if(e.target.id==='leaderSelect'){
    teamLeader=e.target.value;storageWrite('dokkanos-team-leader',teamLeader);
    if(teamLeader&&!selectedTeam.includes(teamLeader)){if(selectedTeam.length>=6)selectedTeam.pop();selectedTeam.unshift(teamLeader);storageWrite('dokkanos-team',JSON.stringify(selectedTeam))}
    renderTeam()
  }
  if(refreshBox)render()
});
window.addEventListener('online',()=>document.body.classList.remove('offline'));window.addEventListener('offline',()=>document.body.classList.add('offline'));if(!navigator.onLine)document.body.classList.add('offline');
boot().catch(()=>{document.body.innerHTML='<div class="fatal"><h2>DokkanOS</h2><p>Impossible de charger la Box. Réessaie avec une connexion internet.</p><button onclick="location.reload()">Réessayer</button></div>'});
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{reg.update().catch(()=>{});navigator.serviceWorker.addEventListener('controllerchange',()=>{try{if(!sessionStorage.getItem('dokkanos-sw-reloaded')){sessionStorage.setItem('dokkanos-sw-reloaded','1');location.reload()}}catch(e){console.warn('Mise à jour disponible : recharge DokkanOS pour l’appliquer.')}})}).catch(()=>{});}
