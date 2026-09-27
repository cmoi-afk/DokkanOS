#!/usr/bin/env python3
"""Couche de localisation française de DokkanOS.
Les clés techniques restent stables; l'UI consomme les champs fr lorsqu'ils existent.
Les dictionnaires sont volontairement versionnés et extensibles pour éviter les
traductions automatiques incohérentes dans les termes Dokkan.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NAME_PARTS={
 "Super Saiyan":"Super Saiyan","Captain Ginyu":"Capitaine Ginyu","Android #":"Cyborg #",
 "Android ":"Cyborg ","Kid":"Enfant","Teen":"Adolescent","Future":"Futur",
 "Full Power":"Pleine puissance","Golden Frieza":"Golden Freezer","Frieza":"Freezer",
 "Master Roshi":"Tortue Géniale","Piccolo":"Piccolo","Krillin":"Krilin",
 "Gohan":"Gohan","Goku":"Goku","Vegeta":"Vegeta","Trunks":"Trunks","Cell":"Cell",
 "Majin Buu":"Boo","Buu":"Boo"
}
TYPE_FR={"AGL":"AGI","TEQ":"TEC","INT":"INT","STR":"PUI","PHY":"END"}
CLASS_FR={"Super":"Super","Extreme":"Extrême"}
CATEGORY_FR={
 "Movie Bosses":"Boss des films","Joined Forces":"Forces jointes","Bond of Friendship":"Lien d'amitié",
 "Pure Saiyans":"Saiyans purs","Hybrid Saiyans":"Saiyans de sang mêlé","Realm of Gods":"Puissance divine",
 "Majin Buu Saga":"Saga de Boo","Future Saga":"Saga du futur","Full Power":"Pleine puissance",
 "Androids":"Cyborgs","Androids/Cell Saga":"Saga des cyborgs/Cell","Kamehameha":"Kamehameha",
 "Super Saiyans":"Super Saiyans","Super Saiyan 2":"Super Saiyan 2","Super Saiyan 3":"Super Saiyan 3",
 "Goku's Family":"Famille de Goku","Vegeta's Family":"Famille de Vegeta","Wicked Bloodline":"Lignée diabolique",
 "Terrifying Conquerors":"Conquérants terrifiants","Movie Heroes":"Héros des films","Transformation Boost":"Transformation fortifiante",
 "Time Travelers":"Voyageurs du temps","Battle of Wits":"Combat cérébral","Earthlings":"Terriens",
 "Youth":"Enfance","Namekians":"Nameks","Giant Form":"Forme géante","Power Absorption":"Absorption de puissance",
 "Rapid Growth":"Croissance rapide","Crossover":"Crossover","Final Trump Card":"Dernier atout",
 "Bond of Parent and Child":"Lien parent-enfant","Battle of Fate":"Combat fatidique","Power Beyond Super Saiyan":"Puissance au-delà du Super Saiyan"
}
LINK_FR={
 "Super Saiyan":"Super Saiyan","Kamehameha":"Kamehameha","Prepared for Battle":"Paré au combat",
 "Shocking Speed":"Vitesse époustouflante","Fierce Battle":"Combat acharné","Legendary Power":"Pouvoir légendaire",
 "Big Bad Bosses":"Boss","Nightmare":"Cauchemar","Fear and Faith":"Peur et désespoir",
 "Golden Warrior":"Guerrier doré","The Saiyan Lineage":"Lignée Saiyan","Royal Lineage":"Lignée royale",
 "Prodigies":"Prodiges","Cold Judgment":"Jugement froid","Brainiacs":"Cerveau","Solid Support":"Soutien solide"
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
    d["localization"]={"default":"fr","fallback":"source","categoryTerms":len(CATEGORY_FR),"linkTerms":len(LINK_FR)}
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8")
if __name__=="__main__":main()
