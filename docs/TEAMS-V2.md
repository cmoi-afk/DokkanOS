# Équipes v1.2

Le laboratoire propose six cartes confirmées de la Box et un leader ami distinct. Il compare plusieurs compositions avec une recherche heuristique limitée, sans prétendre simuler le combat ou démontrer un optimum global.

## Parcours

1. Choisir un événement et une mission vérifiée, ou des quotas personnalisés de catégorie et de types distincts.
2. Choisir les deux leaders, imposer des cartes, optimiser ou comparer les leaders.
3. Lire la couverture PV/ATT/DÉF, les rotations sans chevauchement et les conditions de passif.
4. Sauvegarder une composition et son contexte sur l’appareil. La réalisation des missions se confirme manuellement.

Les bonus supplémentaires exigent la couverture de base. Les restrictions de type et classe sont conjointes. Les quotas précisent si l’ami est inclus. L’optimisation ne complète pas avec des cartes hors leader.

## Limites

Les kits viennent de `card-meta.json`. Niveaux de liens, équipements, éveils-Z réellement effectués, statistiques finales et déroulement du combat ne sont pas connus. Les passifs non structurés ou conditionnels restent à confirmer. Deux cartes de même nom ne reçoivent pas de liens entre elles. Les rotations sont des suggestions, particulièrement si la protection en première position est inconnue.

La comparaison porte sur dix leaders présélectionnés par couverture. Une recherche sans solution ne prouve pas l’impossibilité d’une mission.

## Événements

`events.json` contient sept événements/groupes et neuf missions paraphrasées, vérifiées dans l’annonce française de la partie 3 du 29 septembre 2026. Le catalogue est explicitement partiel ; les disponibilités réelles restent à contrôler en jeu.

Les index GLOBAL FR ont bloqué l’extraction pendant cette session. Aucun import exhaustif n’a pu être vérifié.

`tools/import_events.py` valide et fusionne un export GLOBAL français sourcé : IDs uniques, contraintes reconnues, quotas et inclusion/exclusion de l’ami. Il ne touche aucune donnée de carte. La couverture complète exige un inventaire source et un audit distinct.

## Vérification

`node tools/test_teams.cjs` vérifie base/bonus leader, intersection type/classe, passifs dépendant des alliés, esquive désactivée, quotas sans ami, cinq types, cartes imposées, rotations et schéma d’événements.

`node tools/test_v071.cjs` vérifie les régressions de l’inventaire, du potentiel et du catalogue.

Les fichiers de collection, métadonnées, catalogue et illustrations ne sont pas modifiés. La migration `audit-fr-images-v1` reste indépendante.
