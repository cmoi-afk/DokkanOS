# DokkanOS 3.0 — préparation

État au 4 novembre 2026 : cadrage préparé, fonctionnalités non déclarées livrées.
Base de référence : 16965738ac47c82665b11105561f50efb1e53b4b.

## Objectif produit
Ouvrir l’application et choisir : Réussir une mission / Améliorer ma box / Reprendre mon combat.
Interface française, mobile d’abord, jeu sans achat obligatoire. Les stratégies restent accessibles sans encombrer le premier écran.

## État des lieux
Le dépôt contient déjà collection orientée progression, recherche, suivi de combat, synchronisation optionnelle, moteur de missions et gestion PWA. La 3.0 doit consolider ces fonctions, éviter leur duplication et vérifier leurs raccordements. L’inspection des modules est un inventaire, pas une validation fonctionnelle complète.
Le correctif récent élargit la recherche de leaders : mesurer son coût sur grande box avant généralisation. Les tests historiques et les tests des catégories croisées doivent être réconciliés avec les règles attendues, sans affaiblir les assertions pour masquer une régression.

## Règles du moteur
- Une mission exigeant six membres de X impose X à chaque membre, leader compris. Le bonus leader peut porter sur Y, un type ou plusieurs catégories.
- Une mission exigeant moins de six membres de X n’impose pas X au leader sauf autre contrainte explicite.
- Vérifier chaque branche et condition additionnelle du bonus pour chaque carte ; ne pas attribuer 200 % à tout le groupe par défaut.
- Séparer conformité mission, couverture leader et estimation de puissance. Une équipe conforme n’est pas une victoire garantie.
- Priorité : validité, couverture, puis qualité selon objectif et boss. Ne pas annoncer un optimum global pour une recherche heuristique.
- Équipe prête / à préparer / aucun résultat trouvé : états différents. Le mode Ma Box ne propose aucune possession non confirmée.

## Les quinze chantiers
### 1. Ma session Dokkan
- État : à réaliser et valider.
- Points d’appui : companion.js, progression.js.
- Dépendances : Après 5, 11, 12.
- Travail : Trois actions : Réussir une mission, Améliorer ma box, Reprendre mon combat. Chaque recommandation explique son intérêt et ouvre la cible exacte.
- Acceptation : Box vide, aucune mission accessible, run interrompue : aucun objectif inventé.

### 2. Navigation
- État : à réaliser et valider.
- Points d’appui : interface.js, mobile-comfort.js.
- Dépendances : Après 3.
- Travail : Accueil, Collection, Équipes, Événements, Outils ; missions rattachées à leur événement ; conserver les liens profonds.
- Acceptation : Retour conserve filtres et position ; une mission liée à plusieurs événements reste trouvable.

### 3. Langage visuel
- État : à réaliser et valider.
- Points d’appui : visual.css, teams-ui.css, f2p.css.
- Dépendances : Socle.
- Travail : Portraits et bannières, badges type/rareté, états vide/chargement/erreur, détails repliables.
- Acceptation : Lisible à 390 px et texte agrandi ; couleurs jamais seules porteuses du sens.

### 4. Collection orientée progression
- État : à réaliser et valider.
- Points d’appui : my-collection.js, progress-model.js.
- Dépendances : Après 11.
- Travail : À éveiller, SP, potentiel, prêtes ; distinguer progression déclarée et inconnue.
- Acceptation : Possession préservée ; pas de déduction automatique de SP ou potentiel ; toutes les formes consultables.

### 5. Moteur d’équipes
- État : à réaliser et valider.
- Points d’appui : team-engine.js, team-search.js.
- Dépendances : Priorité 1.
- Travail : Contraintes strictes avant score ; leader lui-même admissible ; couverture réelle des six membres et ami séparé ; catégories croisées autorisées.
- Acceptation : Cas de leader hors intitulé de catégorie mais couvrant les six ; quotas partiels ; missions incompatibles ; ami exclu/inclus selon règle ; annulation et performance.

### 6. Atelier visuel
- État : à réaliser et valider.
- Points d’appui : teams.js, team-locker.js.
- Dépendances : Après 5, 3.
- Travail : Galeries pour leader, ami et remplacement ; conserver/recomposer ; verrous ; annuler ; comparaison des bonus par membre.
- Acceptation : Changer le leader ne perd pas les verrous ; carte incompatible expliquée ; aucun doublon d’éveil ; mode Ma Box strict.

### 7. Stratégie de combat
- État : à réaliser et valider.
- Points d’appui : team-planner.js, boss-profiles.json.
- Dépendances : Après 5.
- Travail : Résumé rotations, dangers avant/après attaque, actifs/objets ; détails facultatifs.
- Acceptation : Deux rotations réalisables, trois flotteurs distincts ; conditions de passifs visibles ; incertitude explicite.

### 8. Événements et missions
- État : à réaliser et valider.
- Points d’appui : events.js, event-model.js, fight-flow.js.
- Dépendances : Après 5, 11.
- Travail : Bannières, missions restantes, fermeture proche, choix conjoint des missions, équipe prête ou à préparer.
- Acceptation : Les contraintes EX restent liées au bon niveau ; succès enregistré seulement sur action utilisateur.

### 9. Carnet de combat
- État : à réaliser et valider.
- Points d’appui : copilot.js, fight-flow.js.
- Dépendances : Après 13.
- Travail : Reprise au point de contrôle ; compteurs individuels SPE normales/ultimes, stacks, objets, actifs ; historique annulable.
- Acceptation : Rechargement et fermeture préservent la run ; pas de mélange entre tentatives ni entre carte personnelle et amie.

### 10. Farming regroupé
- État : à réaliser et valider.
- Points d’appui : sa-farm.js, f2p-model.js, progression.js.
- Dépendances : Après 4, 11.
- Travail : Objectifs multiples regroupés par événement, copies/médailles, progression ; monnaies gratuites explicites.
- Acceptation : Pas de double comptage des ressources ; copies probabilistes signalées ; voies payantes exclues.

### 11. Disponibilité et provenance
- État : à réaliser et valider.
- Points d’appui : event-model.js, f2p-model.js, collecteurs.
- Dépendances : Priorité 1.
- Travail : Disponibilité par offre et carte, début/fin/fuseau/source/date de vérification ; inconnue distincte de fermée.
- Acceptation : Frontières de dates, hors ligne, plusieurs voies, retour d’événement ; une monnaie valide ne rend pas toutes ses cartes disponibles.

### 12. Recherche globale
- État : à réaliser et valider.
- Points d’appui : experience.js, mobile-comfort.js.
- Dépendances : Après 3, 11.
- Travail : Résultats groupés cartes/événements/catégories ; actions contextuelles, accents et alias FR.
- Acceptation : Recherche ne modifie pas la box ; navigation clavier ; résultats limités et pagination.

### 13. Sauvegarde et migration
- État : à réaliser et valider.
- Points d’appui : companion-model.js, sync.js.
- Dépendances : Priorité 1.
- Travail : Inventaire des clés ; schéma versionné ; export avant migration ; aperçu import ; restauration et conflits explicites.
- Acceptation : Import ancien, JSON invalide, quota stockage, conflit et interruption ; migration répétable sans perte. Sync existante à auditer, pas un nouveau service imposé.

### 14. Versions et mise à jour
- État : à réaliser et valider.
- Points d’appui : sw.js, app.js, index.html.
- Dépendances : Priorité 1.
- Travail : Version installée/disponible, nouveautés, bouton appliquer ; publication vérifiée et récupération hors ligne.
- Acceptation : Ne pas recharger pendant une saisie ou run non sauvée ; échec installation conserve version fonctionnelle.

### 15. Confort et performance iPhone
- État : à réaliser et valider.
- Points d’appui : resource-loader.js, mobile-comfort.js, images.
- Dépendances : Transversal.
- Travail : Chargement différé, listes paginées, safe areas, focus et scroll préservés, mouvement réduit.
- Acceptation : Mesurer lancement/recherche/génération sur large box ; objectifs chiffrés après mesure initiale ; vérifier iPhone et mode hors ligne.

## Ordre de réalisation
1. Lot A — fiabilité : 5, 11, 13, 14, mesures initiales de 15.
2. Lot B — parcours visuels : 3, 2, 6, 8, 12.
3. Lot C — accompagnement : 4, 10, 7, 9, 1.
Chaque lot reçoit ses tests et sa revue mobile avant activation. Les dépendances entre lots priment sur leur numérotation.

## Validation avant version 3.0
- Sauvegarde 2.x importée et restituée : box, progression, favoris, équipes, missions, journaux et réglages.
- Cas mission avec leader à catégorie croisée, ami distinct, verrous, exclusions et données inconnues.
- Parcours complet événement → mission → équipe → modification → stratégie → journal → résultat.
- Disponibilité par offre avec horodatage explicite ; aucune date inventée.
- Aucun écran bloqué par le chargement, aucun contrôle masqué par la barre iPhone.
- Tests exécutés sur les fichiers exacts de la version publiée, pas une ancienne copie locale.
- Version servie et mise à jour PWA contrôlées après publication.

## Premier lot concret à développer
Constituer des scénarios de référence pour les missions et leaders, auditer les sauvegardes, puis unifier les statuts de disponibilité. Préparer ensuite les trois entrées de l’accueil sur ces données fiables. Ne pas changer le numéro public en 3.0 tant que ces critères ne sont pas remplis.
