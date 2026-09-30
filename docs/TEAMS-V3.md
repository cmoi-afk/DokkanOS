# Équipes : choisir un leader et ses partenaires

L'onglet propose maintenant un parcours en trois étapes : leader, composition, analyse. Les cartes du catalogue peuvent être recherchées par nom, SSJ3, type ou ID. Le choix d'une carte non possédée affiche une confirmation « Je possède » ; la génération utilise ensuite uniquement les cartes confirmées de la Box, y compris les ajouts manuels.

## Composition automatique

- Le leader est conservé dans les six emplacements. L'ami est une septième instance distincte et peut reproduire le leader.
- Priorités : synergies de passifs, liens, survie ou dégâts. Les quotas de mission restent prioritaires ; les données inconnues sont signalées.
- Recherche par faisceau avec présélection des partenaires de liens et des cartes activant des conditions. Le résultat est une estimation, pas une garantie d'optimum global ni une simulation de combat.
- Cartes à garder, exclusions, jusqu'à trois propositions différentes, remplacement manuel évalué dans la composition et annulation du dernier changement.
- Comparaison des huit leaders possédés couvrant le plus de cartes, avec les mêmes contraintes. Ce raccourci ne compare pas tous les leaders du catalogue.
- Calcul dans un Web Worker pour garder l'interface disponible, avec annulation. Un repli utilise le même moteur si les workers sont indisponibles.

## Analyse

Les quinze paires de la composition sont inspectables dans une matrice de liens. Le total des liens décrit la compatibilité entre cartes : tous ces liens ne s'activent pas simultanément. Les cartes de même nom n'activent aucun lien entre elles.

Les rotations proposent deux paires fixes et un troisième partenaire pris parmi les flottants. Les conditions de composition, de rotation et de combat sont distinguées. Les soutiens détectés indiquent les cartes bénéficiaires, et les kits restent consultables avec leur source.

Les conditions « trois personnages d'une même catégorie » sont comptées catégorie par catégorie. Un mélange de trois catégories différentes ne suffit pas. La condition « tous les alliés » exige les six cartes et l'ami. Une copie du leader ami est un allié distinct pour les passifs.

## Cartes récentes

`recent-cards.json` ajoute les formes finales 1034201 (Goku SSJ3 LR INT), 1034151 (Boo petit LR INT) et 1034171 (Boo Kaïo Shin du Sud PUI). Les IDs logiques et les ressources d'image sont explicitement séparés d'après les fiches sources.

Les kits sont résumés, leurs interactions importantes sont structurées et leurs catégories sont explicitement partielles. Ces ajouts ciblés ne constituent pas un catalogue complet des dernières sorties. Les images récentes sont distantes ; leur disponibilité hors ligne n'est pas garantie. Le fichier et le worker sont inclus dans le cache PWA.

Les niveaux de liens, équipements et éveils-Z réellement effectués ne sont pas connus. Le moteur n'estime pas les dégâts finaux ou la survie contre chaque attaque ennemie. Les événements existants et leurs missions sont conservés ; le raccourci Saga de Boo niveau 4 impose six cartes de cette catégorie et privilégie la survie. Les actions à réaliser en combat restent à vérifier en jeu.

## Validation

Suites du moteur, cartes récentes, worker, service worker, filtres et intégration DOM. L'intégration couvre recherche SSJ3, possession explicite, génération de six cartes compatibles, mission Saga de Boo, remplacement/annulation, exclusions, export, stockage indisponible et rejet des résultats d'une recherche annulée. Les tests DOM ne remplacent pas une validation visuelle sur téléphone.
