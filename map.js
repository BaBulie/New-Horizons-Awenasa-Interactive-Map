import { places } from './places.js';

// Regions and settlement types
const regions = [
            'asturias', 'dumanon', 'gallia', 'sasanshahr',
            'daramos', 'tzukyn', 'galasaar', 'kitzra', 'ritan',
            'dwarven', 'amutep', 'banenrhun', 'stargazers'
        ];

const types = [ 'capital', 'city', 'village' ]

// Size and anchor presets
const presets = {
    capital: { size: [ 30, 30 ], anchor: [ 15, 15 ], tooltip: [ 0, -15 ] },
    city:    { size: [ 30, 30 ], anchor: [ 15, 15 ], tooltip: [ 0, -15 ] },
    village: { size: [ 20, 20 ], anchor: [ 10, 10 ], tooltip: [ 0, -10 ] }
};

// Build custom icon
function makeIcon( region, type ) {
    const preset = presets[ type ];
    return L.icon( {
        iconUrl: `icons/${region}_${type}.png`,
        iconSize: preset.size,
        iconAnchor: preset.anchor,
        tooltipAnchor: preset.tooltip
    } );
};

const icons = {};

regions.forEach( region => {
    types.forEach( type => {
        icons[`${region}_${type}`] = makeIcon( region, type );
    } );
} );

// Coordinate translation helper
var yx = L.latLng;

var xy = function( x, y ) {
    if ( Array.isArray( x ) ) {
        return yx( 2048 - x[ 1 ], x[ 0 ] );
    }
    return yx( 2048 - y, x );
};

// Wire everything up and export
export function initMap() {
    // Create markers
    const markersByRegion = {};
    places.forEach( place => {
        const marker = L.marker( xy( ...place.coords ), {
            icon: icons[ place.iconKey ],
            title: place.name
        } )
        .bindTooltip( place.name, { permanent: true, direction: "top" } )
        .on( 'click', function () {
            sidebar.setContent(
                `<h2>${place.name}</h2><p>${place.info}</p>`
            )
            sidebar.show();
        } )

        markersByRegion[ place.region ] = markersByRegion[ place.region ] || [];
        markersByRegion[ place.region ].push( marker )
    } );

    // Polygons
    var tzukyn_wilds = L.polygon( [
        xy( 1105, 1077 ),
        xy( 1108, 1134 ),
        xy( 1070, 1110 ),
        xy( 1064, 1094 ),
        xy( 1081, 1080 )
    ], { color: "#007f7f" } );

    var great_plains = L.polygon( [
        xy( 478,  765 ),
        xy( 644,  765 ),
        xy( 749,  927 ),
        xy( 731, 1020 ),
        xy( 542,  992 ),
        xy( 449,  888 )
    ], { color: "#d4af37" } );

    var arctic = L.polygon ( [
        xy( 495,  42 ),
        xy( 754,  42 ),
        xy( 773, 215 ),
        xy( 773, 215 ),
        xy( 471, 417 ),
        xy( 242, 467 ),
        xy( 202, 247 )
    ], { color: "#abc9d6" } );

    var north_wilds = L.polygon ( [
        xy(  845, 322 ),
        xy( 1285, 347 ),
        xy( 1318, 375 ),
        xy( 1227, 419 ),
        xy(  894, 476 ),
        xy(  696, 668 ),
        xy(  596, 676 ),
        xy(  568, 595 )
    ], { color: "#977f3e" } );

    // Toggleable layers
    const layerGroups = {};
    for ( const region in markersByRegion ) {
        layerGroups[ region ] = L.layerGroup( markersByRegion[ region ] );
    }

    layerGroups.tzukyn.addLayer( tzukyn_wilds );
    layerGroups.others.addLayer( great_plains );
    layerGroups.others.addLayer( arctic );
    layerGroups.others.addLayer( north_wilds );

    // Map initialization
    var map = L.map( "map", {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 3,
        layers: [layerGroups.asturias, layerGroups.dumanon, layerGroups.gallia, layerGroups.sasanshahr,
                layerGroups.daramos, layerGroups.tzukyn, layerGroups.galasaar, layerGroups.kitzra, layerGroups.ritan,
                layerGroups.dwarves, layerGroups.amutep, layerGroups.banenrhun, layerGroups.stargazers, layerGroups.others]
    });

    // Map layer
    var bounds = [ [ 0,0 ], [ 2048,2018 ] ];
    var image = L.imageOverlay( "awenasa.png", bounds );

    image.addTo( map );
    map.fitBounds( bounds );

    // Layer control
    var baseMaps = {
        "Awenasa": image
    }

    var overlayMaps = {
        "Asturias": layerGroups.asturias,
        "Dumanon": layerGroups.dumanon,
        "Gallia": layerGroups.gallia,
        "Sasanshahr": layerGroups.sasanshahr,
        "House Daramos": layerGroups.daramos,
        "House Tzukyn": layerGroups.tzukyn,
        "House Galasaar": layerGroups.galasaar,
        "House Kitzra": layerGroups.kitzra,
        "House Ritan": layerGroups.ritan,
        "Ancient Dwarves": layerGroups.dwarves,
        "Amu-Tep": layerGroups.amutep,
        "Banen'Rhûn": layerGroups.banenrhun,
        "Stargazers": layerGroups.stargazers,
        "Others": layerGroups.others
    }

    // Add markers, polygons to map
    var layerControl = L.control.layers( baseMaps, overlayMaps, { collapsed: false, hideSingleBase: true } ).addTo( map );
    great_plains.bindTooltip( "Great Plains", { permanent: true, direction: "center" } ).addTo( map );
    tzukyn_wilds.addTo( map );
    arctic.bindTooltip( "Arctic", { permanent: true, direction: "center" } ).addTo( map );
    north_wilds.bindTooltip( "Northern Wilderness", { permanent: true, direction: "top" } ).addTo( map );

    // Sidebar
    var sidebar = L.control.sidebar( 'sidebar', {
        position: 'left',
        autoPan: false
    } );

    map.addControl( sidebar );

    map.on( 'click', function () {
        sidebar.hide();
    } );

    // PinSearch
    var searchBar = L.control.pinSearch( {
        position: 'topright',
        placeholder: 'Search...',
        buttonText: 'Search',
        searchBarWidth: '196px',
        searchBarHeight: '30px',
        maxSearchResults: 4
    }).addTo( map );

    // Credits
    L.controlCredits({
        imageurl: './BaBulie.png',
        imagealt: 'BaBulie logo',
        tooltip: 'Made by BaBulie',
        width: '60px',
        height: '20px',
        expandcontent: 'Interactive map<br/>made by <a href="https://github.com/BaBulie/" target="_blank">BaBulie</a>',
        position: 'bottomleft'
    }).addTo(map);
}

initMap();
