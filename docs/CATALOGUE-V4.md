# Catalogue v4
Le catalogue affiche uniquement les cartes jouables SSR, UR et LR. Les captures de Box et les états de possession sont conservés ; les SR sont retirées du catalogue, pas des captures.

Le filtre « Éveils maximum » affiche le dernier stade des chaînes explicitement vérifiées. « Toutes les SSR / UR / LR » permet de consulter les formes intermédiaires. Recherche par nom, SSJ3, ID, catégorie ou lien ; pagination de 60 cartes ; filtres de possession, rareté, type, classe, éveil Z et qualité des informations.

Chaque fiche contient Informations et Éveils Z. Les versions ZTUR, Super ZTUR, ZLR et Super ZLR sont stockées sur le même ID, avec leurs aptitudes et leurs médailles. Aucun doublon de carte n'est ajouté pour un kit Z. Une mention historique EZA ne suffit pas : une version exige un kit vérifié sur son étape exacte, déjà disponible sur Global.

Consulter une version n'affirme pas qu'elle est réalisée. « Utiliser cette version pour mes équipes » enregistre un choix explicite pour les cartes possédées et adapte l'analyse des passifs. Le kit de base reste conservé.

La collecte rapproche les index français et Global de DokkanInfo, puis vérifie chaque ID exact. Les pages qui affichent une forme éveillée à la place de l'ID demandé sont complétées par l'API propre à cet ID, sans surclasser automatiquement la Box. Les ressources d'image proviennent des champs explicites resource_id, asset_id ou icon_id ; aucun suffixe d'ID n'est modifié pour deviner un visuel.

Les images sont décodées et stockées localement. La disponibilité complète est indiquée seulement lorsque le rapport ne contient plus de fiches, kits Z ou images à reprendre. Le rapport détaillé est docs/CATALOG-AUDIT-v4.json, et sa synthèse catalogue-report.json.

Validation : règles du catalogue, versions indépendantes, recherche, pagination, onglet Z, médailles, confirmation de possession, choix du kit pour les équipes, protection du texte des fiches, favoris, potentiel et cache PWA. Les suites existantes de Box, équipes et stockage restent exécutées.

## Résultat du 30 septembre 2026

4 494 formes : 1 350 SSR, 2 826 UR et 318 LR ; 159 SR retirées. 4 494 illustrations locales décodées, aucun visuel manquant. 706 kits : 552 ZTUR, 23 Super ZTUR, 118 ZLR et 13 Super ZLR. Aucune entrée publiée du référentiel Global ne manque après exclusions explicites des cartes non jouables.

4 493 kits de base sont contrôlés. L'ancien ID 1010900 (M. Satan / Hercule) reste partiel : son API exacte renvoie une erreur 500, et les sources alternatives ne permettent pas de garantir ses statistiques propres. La fiche actuelle 1010901 et ses éveils sont contrôlés. Le rapport reste donc « partial » et l'interface signale cette limite.

Les statistiques UR au niveau 140 appliquent la formule du composant public de DokkanInfo : max + arrondi((max - initial) × 0,4839). Les champs hp_hipo / atk_hipo / def_hipo sont des bonus à ajouter, pas des statistiques totales. Les niveaux requis des variantes SP sont conservés et les variantes inaccessibles au niveau SP de base sont masquées.

Pour 19 réponses Z sans SP, les special_set_id et lv_start sont recoupés avec les mêmes attaques du référentiel Global ; les textes FR proviennent de ces identifiants exacts. Aucun passif japonais n'est substitué à un passif Global.
