#!/bin/bash

dl() {
	d="`dirname "$1"`"
	[ -d "$d" ] || mkdir -p "$d"
	wget -O "$1" "$2"
}

dl Cards/cards.jpg https://i.imgur.com/WB3UPUo.jpg

dl Catan/resourcesback.jpg http://cloud-3.steamusercontent.com/ugc/155773601379978926/E64780188E430DC0EA026912425FDB8A12FE8815/
dl Catan/developmentback.jpg http://cloud-3.steamusercontent.com/ugc/155773601379981450/04512EAB716A01C851124DC0F078EF6D8BD0379F/
dl Catan/yellowback.jpg http://cloud-3.steamusercontent.com/ugc/155773601380005951/A64A315040D186A40F441B8D7F2D469257DE6EDE/
dl Catan/greenback.jpg http://cloud-3.steamusercontent.com/ugc/155773601380011534/565F4C7CCF623AF489C92C44E141E43F1B493F45/
dl Catan/blueback.jpg http://cloud-3.steamusercontent.com/ugc/155773601380013179/07481D4635528672FF17F2B497514C82C6506F3E/
dl Catan/blue.jpg http://cloud-3.steamusercontent.com/ugc/450740801085187216/656F83867B5D858D03F930B2BC05124B5FD21C00/
dl Catan/green.jpg http://cloud-3.steamusercontent.com/ugc/450740801085188033/43537C54F8C515837C9C01C978AA80A59C83BEFB/
dl Catan/yellow.jpg http://cloud-3.steamusercontent.com/ugc/450740801085188580/EFFC1575CD19BBAD1A949DA40516CF61BE87ABE0/
dl Catan/resources.jpg http://cloud-3.steamusercontent.com/ugc/450740801085189347/F2190E4E8C93F1618399C40F603922AD7632DFEC/
dl Catan/development.jpg http://cloud-3.steamusercontent.com/ugc/450740801085190066/960B23E96F18AC87B2C63431ED83F5C45385207F/

dl Hanabi/cards.jpg https://i.imgur.com/R7MQrSt.jpg

dl Starfarer/front.jpg https://i.imgur.com/DfANAuF.jpg
dl Starfarer/back.jpg https://i.imgur.com/OtqcqRo.jpg

dl TicketToRide/ticket.png http://cloud-3.steamusercontent.com/ugc/187296715229502403/9B4942B11CB2BE42EB2E475F9E41C3016C84A9F8/
dl TicketToRide/train.png http://cloud-3.steamusercontent.com/ugc/187296715229100931/7BEE5157837E1E787678C5634F8F6D2A83269D82/

