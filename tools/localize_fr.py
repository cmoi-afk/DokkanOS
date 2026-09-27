#!/usr/bin/env python3
"""Couche de localisation française de DokkanOS.
Les clés techniques restent stables; l'UI consomme les champs fr lorsqu'ils existent.
Les dictionnaires sont volontairement versionnés et extensibles pour éviter les
traductions automatiques incohérentes dans les termes Dokkan.
"""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NAME_PARTS={
 "Golden Frieza":"Golden Freezer","Mecha Frieza":"Mecha Freezer","Frieza":"Freezer",
 "Captain Ginyu":"Ginyu","Android #":"C-","Android ":"C-","Master Roshi":"Kamesennin",
 "Mercenary Tao":"Tao Pai Pai","Tien":"Tenshinhan","Chiaotzu":"Chaozu","Jeice":"Jeese","Recoome":"Reacum","Burter":"Butta",
 "Pikkon":"Paikuhan","King Cold":"Roi Cold","King Vegeta":"Roi Vegeta","Kid Buu":"Boo (petit)","Super Buu":"Boo (super)",
 "Gohan (Kid)":"Son Gohan (petit)","Gohan (Youth)":"Son Gohan (enfant)","Gohan (Teen)":"Son Gohan (jeune)",
 "Goten (Kid)":"Son Goten (petit)","Trunks (Kid)":"Trunks (petit)","Bulma (Youth)":"Bulma (enfant)","Pan (Kid)":"Pan (petit)",
 "Goku":"Son Goku","Buu":"Boo","Future":"futur","Angel":"ange","Youth":"enfant","Teen":"jeune","Kid":"petit"
}
TYPE_FR={"AGL":"AGI","TEQ":"TEC","INT":"INT","STR":"PUI","PHY":"END"}
CLASS_FR={"Super":"Super","Extreme":"Extrême"}
CATEGORY_FR={
 "Power Absorption":"Absorption de puissance","Youth":"Arc enfant","Connected Hope":"Aspirations connectées",
 "Super Bosses":"Boss de DB Super","GT Bosses":"Boss de GT","Movie Bosses":"Boss des films","Worldwide Chaos":"Chaos mondial",
 "Dragon Ball Seekers":"Chercheurs de boules de cristal","Battle of Fate":"Combat du destin","Accelerated Battle":"Combat rapide",
 "Earth-Bred Fighters":"Combattant ayant grandi sur Terre","Golden Warrior":"Combattant doré","Otherworld Warriors":"Combattants de l'au-delà",
 "Ginyu Force":"Commando Ginyu","Corroded Body and Mind":"Corps et esprit corrompus","Rapid Growth":"Croissance rapide",
 "Crossover":"Crossover","Androids":"Cyborg","Androids/Cell Saga":"Cyborg - Saga de cell","DAIMA":"DAIMA","Final Trump Card":"Dernier atout",
 "Planetary Destruction":"Destructeurs de planètes","Inhuman Deeds":"Diaboliques et sans merci","Worthy Rivals":"Digne rival","Realm of Gods":"Divin",
 "Dragon Ball Heroes":"Dragon Ball Heroes","Shadow Dragon Saga":"Dragon maléfique","Turtle School":"École tortue","Earth-Protecting Heroes":"Héros protecteur de la Terre",
 "Youth":"Enfant","Sworn Enemies":"Ennemi juré","Team Bardock":"Equipe Bardock","Legendary Existence":"Être légendaire",
 "Miraculous Awakening":"Eveil miraculeux","Mastered Evolution":"Evolution maîtrisée","Exploding Rage":"Explosion de colère",
 "Goku's Family":"Famille de Son Goku","Vegeta's Family":"Famille de Vegeta","Peppy Gals":"Fille pleine de vie","Joined Forces":"Forces jointes",
 "Giant Form":"Forme géante","Fusion":"Fusion","Fused Fighters":"Guerrier fusionné","Low-Class Warrior":"Guerrier inférieur",
 "Gifted Warriors":"Guerriers de génie","Space-Traveling Warriors":"Guerriers galactiques","Successors":"Héritier",
 "Super Heroes":"Héros de DB Super","GT Heroes":"Héros de GT","Defenders of Justice":"Héros de la justice","Movie Heroes":"Héros des films",
 "Kamehameha":"Kamehameha","Power of Wishes":"Le Pouvoir des voeux","Storied Figures":"Légende ancestrale","Sibling's Bond":"Lien de fratrie",
 "Bond of Master and Disciple":"Lien maître et disciple","Bond of Parent and Child":"Lien Parental","Bond of Friendship":"Liens d'amitié",
 "Wicked Bloodline":"Lignée diabolique","Full Power":"Lutte à pleine puissance","Namekians":"Namek","Target: Goku":"Objectif Son Goku",
 "Tournament Participants":"Participants aux tournois","Heavenly Events":"Péripéties célestes","Special Pose":"Pose spéciale","Potara":"Potalas",
 "Majin Power":"Pouvoir de Majin","Demonic Power":"Pouvoir démoniaque","Prodigious Warriors":"Prodiges du combat",
 "Power Beyond Super Saiyan":"Puissance au-delà du Super Saiyan","Giant Ape Power":"Puissance de Gorille","Uncontrollable Power":"Puissance incontrôlable",
 "Maximum Power":"Puissance maximale","Powerful Comeback":"Puissance restaurée","Representatives of Universe 7":"Représentants de l'Univers 7",
 "Resurrected Warriors":"Ressuscité","Majin Buu Saga":"Saga de Boo","Planet Namek Saga":"Saga de Namek","Saiyan Saga":"Saga des Saiyans",
 "Future Saga":"Saga du futur","Hybrid Saiyans":"Saiyan de sang-mêlé","Pure Saiyans":"Saiyan pur","Saviors":"Sauveur",
 "Super Saiyans":"Super Saiyan","Super Saiyan 2":"Super Saiyan 2","Super Saiyan 3":"Super saiyan 3","Universe Survival Saga":"Survie de l'Univers",
 "Time Limit":"Temps limité","World Tournament":"Tenkaichi Budokai","Earthlings":"Terrien","Terrifying Conquerors":"Terrifiants conquérants",
 "Transformation Boost":"Transformation fortifiante","Universe 11":"Univers 11","Universe 6":"Univers 6","Revenge":"Vengeance",
 "Artificial Life Forms":"Vie artificielle","Entrusted Will":"Volonté confiée","Time Travelers":"Voyageur du temps"
}
LINK_FR={
 "Super Saiyan":"Super Saiyan","Kamehameha":"Kamehameha","Prepared for Battle":"Paré au combat",
 "Shocking Speed":"Vitesse époustouflante","Fierce Battle":"Combat acharné","Legendary Power":"Pouvoir légendaire",
 "Big Bad Bosses":"Boss","Nightmare":"Cauchemar","Fear and Faith":"Peur et désespoir","Golden Warrior":"Guerrier doré",
 "The Saiyan Lineage":"L'origine des saiyans","Saiyan Warrior Race":"Race saiyan","Royal Lineage":"Lignée royale",
 "Prodigies":"Génie","Cold Judgment":"Jugement serein","Brainiacs":"Intello","Solid Support":"Soutien infaillible",
 "Over in a Flash":"Combat éclair","Experienced Fighters":"Guerrier vétéran","Infighter":"Fonceur",
 "Berserker":"Berserker","Metamorphosis":"Métamorphose","Infinite Regeneration":"Régénération infinie",
 "Majin":"Majin","Thirst for Conquest":"Soif de conquête","Godly Power":"Pouvoir divin","Warrior Gods":"Dieux guerriers",
 "Tournament of Power":"Tournoi du Pouvoir","Messenger from the Future":"Messager du futur",
 "Turtle School":"École tortue","All in the Family":"Liens familiaux","Galactic Visitor":"Visiteur d'ailleurs",
 "High Compatibility":"Super compatibilité","Android Assault":"Amélioration cybernétique","Saiyan Roar":"Rugissement saiyan",
 "The First Awakened":"Le premier éveillé","Limit-Breaking Form":"Forme brisant la limite","Hatred of Saiyans":"Haine des Saiyans",
 "Fusion Failure":"Échec de fusion","Infinite Energy":"Énergie infinie","Ultimate Lifeform":"Forme ultime",
 "Shadow Dragons":"Dragons maléfiques","Dismal Future":"Futur désespéré","Supreme Power":"La puissance suprême",
 "Soul vs Soul":"Âme vs âme"
}
def tr_name(s):
    if not s:return s
    for a,b in sorted(NAME_PARTS.items(),key=lambda x:-len(x[0])):s=s.replace(a,b)
    return s
def main():
    p=ROOT/"card-meta.json"; d=json.loads(p.read_text(encoding="utf-8"))
    for c in d.get("cards",{}).values():
        fr=c.setdefault("fr",{})
        fr["name"]=tr_name(c.get("name",""))
        if c.get("type"):fr["type"]=TYPE_FR.get(c["type"],c["type"])
        if c.get("class"):fr["class"]=CLASS_FR.get(c["class"],c["class"])
        if c.get("categories"):fr["categories"]=[CATEGORY_FR.get(x,x) for x in c["categories"]]
        if c.get("links"):fr["links"]=[LINK_FR.get(x,x) for x in c["links"]]
        # Local fallback must never pretend untranslated EN is French.
        fr["_fallbackFields"]=[k for k in ("name","categories","links") if (
            (k=="name" and fr.get(k)==c.get(k) and re.search(r"\\b(?:Kid|Teen|Future|Captain|Android|Full Power|Master|Mercenary|Officer|King|Youth)\\b",str(c.get(k,"")),re.I)) or
            (k in ("categories","links") and any(a==b and re.search(r"[A-Za-z]{4}",str(a)) for a,b in zip(fr.get(k,[]),c.get(k,[]))))
        )]
    d["localization"]={"default":"fr","fallback":"source","categoryTerms":len(CATEGORY_FR),"linkTerms":len(LINK_FR)}
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8")
if __name__=="__main__":main()
