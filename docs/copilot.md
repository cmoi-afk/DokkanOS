# Copilote DokkanOS · v1.9

Accessible dans **Plus → Copilote**, depuis une équipe ou depuis une fiche de carte.

| Outil | Fonctionnement | Limite explicite |
| --- | --- | --- |
| Guide de combat | Composition actuelle, diagnostic, deux rotations disjointes, flottants, mise en place et conditions d’actives | Ordre de départ, compteurs et dégâts inconnus |
| Passifs | Sections du kit choisi, état des conditions et conseils de timing | Une condition de combat ne devient pas automatiquement active |
| Équipements | Priorités expliquées, objectif et esquive désactivée pris en compte, valeurs manuelles conservées | Pas de calcul de build optimal ni de dégâts |
| Plusieurs missions | Jusqu’à douze missions du même niveau, contraintes du niveau incluses, recherche en worker et sélection de groupes | Groupes de composition approchés ; victoire et actions à confirmer |
| Farming | Chaîne d’éveil, médailles Z vérifiées, stock saisi, ressources et niveaux associés manuellement | Les rapprochements d’événements par nom ne prouvent pas un drop |
| Après une défaite | Carte, tour, position, moment et problème ; pistes d’ajustement conservées | Hypothèses à tester, pas une reconstitution du combat |
| Captures | Descripteurs visuels locaux, grille cadrée manuellement, cinq suggestions par position et recherche alternative | Pas d’ajout avant confirmation ; pas de comptage automatique des doublons |
| Compléter mon équipe | Remplacements hypothétiques classés sur les kits, gains/pertes et alternatives possédées | Aucun conseil de dépense ou taux de victoire |
| Partage | Fiche texte, code JSON validé, aperçu des cartes non possédées et chargement des cartes confirmées | L’inventaire et les versions de kit ne sont pas modifiés par le code |
| Mode rapide | Box par lots, écrans secondaires différés, missions lourdes à la demande, cache versionné, images de Box préparables | Images non consultées à charger ou préparer avant usage hors ligne |

Les données personnelles `dokkanos-copilot-v1` et `dokkanos-performance-v1` font partie de la sauvegarde complète. Les captures restent en mémoire de la session et ne sont pas envoyées ni incluses dans la sauvegarde.

Les index se reconstruisent depuis les données du dépôt :

```sh
python tools/build_event_preview.py
python tools/build_visual_index.py
```

Tests de modèle : `node tools/test_copilot.cjs`. L’audit navigateur vérifie les dix outils sur mobile et ordinateur, les imports invalides, l’identification d’une image de référence, la confirmation explicite de possession, la conservation des saisies et le hors ligne.
