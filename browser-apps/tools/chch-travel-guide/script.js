/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Christchurch Travel Guide JavaScript
*/

const categories = [
    {
        id: 'cultural-historical',
        name: 'Cultural & Historical',
        places: [
            {
                name: 'Arts Centre',
                description: 'Historic Gothic Revival complex with galleries, studios, and weekend markets.',
                link: 'https://www.artscentre.org.nz/',
                image: 'arts-centre.jpg'
            },
            {
                name: 'BNZ Centre',
                description: 'City Centre architecture featuring modern design elements.',
                link: 'https://fivelanes.co.nz/stores/',
                image: 'bnz-centre.jpg'
            },
            {
                name: 'Canterbury Museum',
                description: 'Māori artifacts & Antarctic exhibits showcasing regional history and exploration.',
                link: 'https://www.canterburymuseum.com/',
                image: 'canterbury-museum.jpg'
            },
            {
                name: 'Canterbury Earthquake National Memorial',
                description: 'Tribute to 2011 quake victims, a place for reflection and remembrance.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-attractions/canterbury-earthquake-national-memorial',
                image: 'earthquake-memorial.jpg'
            },
            {
                name: 'Cathedral Square',
                description: 'Iconic city centre landmark with historic significance and events.',
                link: 'https://www.christchurchnz.com/experience/cathedral-square/',
                image: 'cathedral-square.jpg'
            },
            {
                name: 'Ferrymead Heritage Park',
                description: 'Living history museum with tram rides and historic displays.',
                link: 'https://ferrymead.org.nz/',
                image: 'ferrymead.jpg'
            },
            {
                name: 'Quake City',
                description: 'Earthquake Museum telling the story of the Canterbury earthquakes.',
                link: 'https://www.canterburymuseum.com/visit-us/quake-city/',
                image: 'quake-city.jpg'
            },
            {
                name: 'Riccarton House & Bush',
                description: 'Historic homestead & trails through native forest.',
                link: 'https://www.riccartonhouse.co.nz/',
                image: 'riccarton-house.jpg'
            },
            {
                name: 'Sign of the Takahe',
                description: 'Heritage building with panoramic views, available for functions.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-attractions/sign-of-the-takahe',
                image: 'sign-takahe.jpg'
            },
            {
                name: 'Cardboard Cathedral',
                description: 'Formally Transitional Cathedral, an architectural marvel built after the earthquakes.',
                link: 'https://www.cardboardcathedral.org.nz/',
                image: 'cardboard-cathedral.jpg'
            },
            {
                name: 'Wigram Airforce Museum',
                description: 'Military aviation history with vintage aircraft and interactive exhibits.',
                link: 'https://www.airforcemuseum.co.nz/',
                image: 'airforce-museum.jpg'
            },
            {
                name: 'Victoria Clock Tower',
                description: 'Beautifully restored historic landmark in the city centre.',
                link: 'https://www.christchurchnz.com/experience/victoria-clock-tower/',
                image: 'victoria-clock.jpg'
            },
            {
                name: 'Bridge of Remembrance',
                description: 'Iconic war memorial with great photo spots and historical significance.',
                link: 'https://www.christchurchnz.com/experience/bridge-of-remembrance/',
                image: 'bridge-remembrance.jpg'
            },
            {
                name: 'Christchurch Art Gallery',
                description: 'Contemporary art gallery with impressive collections and architecture.',
                link: 'https://www.christchurchartgallery.org.nz/',
                image: 'art-gallery.jpg'
            },
            {
                name: 'New Regent Street',
                description: 'Colorful Spanish Mission-style street with boutique shops and cafes.',
                link: 'https://www.christchurchnz.com/experience/new-regent-street/',
                image: 'new-regent-street.jpg'
            }
        ]
    },
    {
        id: 'outdoor-nature',
        name: 'Outdoor & Nature',
        places: [
            {
                name: 'Avon River',
                description: 'Punting, walks along the picturesque river flowing through the city.',
                link: 'https://www.christchurchnz.com/experience/punting-on-the-avon/',
                image: 'avon-river.jpg'
            },
            {
                name: 'Banks Peninsula',
                description: 'Scenic drives & hikes through volcanic landscapes with stunning coastal views.',
                link: 'https://www.bankspeninsula.co.nz/',
                image: 'banks-peninsula.jpg'
            },
            {
                name: 'Botanic Gardens',
                description: 'Rose garden, conservatory, aviary, cafe, walks through beautifully maintained gardens.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-botanic-gardens',
                image: 'botanic-gardens.jpg'
            },
            {
                name: 'Bottle Lake Forest',
                description: 'Mountain biking & walks through pine forest with coastal access.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-parks/bottle-lake-forest-park',
                image: 'bottle-lake.jpg'
            },
            {
                name: 'Hagley Park',
                description: 'North & South - gardens, golf course, sports fields in the heart of the city.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-parks/hagley-park',
                image: 'hagley-park.jpg'
            },
            {
                name: 'Halswell Quarry',
                description: 'Walking trails through former quarry with interesting geological features.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-parks/halswell-quarry',
                image: 'halswell-quarry.jpg'
            },
            {
                name: 'McLeans Forest',
                description: 'Mountain biking trails for all skill levels in native bush setting.',
                link: 'https://www.mcleansisland.com/mcleans-forest',
                image: 'mcleans-forest.jpg'
            },
            {
                name: 'McLeans Island Equestrian Park',
                description: 'Horse riding facilities and trails through scenic landscapes.',
                link: 'https://www.mcleansisland.com/equestrian-park',
                image: 'equestrian-park.jpg'
            },
            {
                name: 'Orana Wildlife Park',
                description: 'Open-range zoo with New Zealand\'s only gorillas and many native species.',
                link: 'https://www.oranawildlifepark.co.nz/',
                image: 'orana-park.jpg'
            },
            {
                name: 'Port Hills Scenic Walk',
                description: 'Panoramic views of the city, Lyttelton Harbour and the Southern Alps.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/walking-and-hiking-in-christchurch/port-hills-walks',
                image: 'port-hills.jpg'
            },
            {
                name: 'Travis Wetland Nature Heritage Park',
                description: 'Birdwatching in one of Christchurch\'s largest freshwater wetlands.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-parks/travis-wetland-nature-heritage-park',
                image: 'travis-wetland.jpg'
            },
            {
                name: 'Willowbank Wildlife Reserve',
                description: 'Native NZ species including kiwi in natural habitat settings.',
                link: 'https://www.willowbank.co.nz/',
                image: 'willowbank.jpg'
            },
            {
                name: 'Mona Vale',
                description: 'Historic homestead with beautiful gardens, perfect for a peaceful stroll.',
                link: 'https://www.monavale.co.nz/',
                image: 'mona-vale.jpg'
            },
            {
                name: 'Christchurch Gondola',
                description: 'Scenic cable car ride to the top of the Port Hills with breathtaking views.',
                link: 'https://www.gondola.co.nz/',
                image: 'gondola.jpg'
            }
        ]
    },
    {
        id: 'adventure-activities',
        name: 'Adventure & Activities',
        places: [
            {
                name: 'Alpine Ice Skating Rink',
                description: 'Indoor ice skating for all ages and skill levels.',
                link: 'https://alpineice.co.nz/',
                image: 'ice-skating.jpg'
            },
            {
                name: 'Antigua Boat Shed',
                description: 'Punting/canoe hire on the Avon River in historic boat sheds.',
                link: 'https://www.boatsheds.co.nz/',
                image: 'antigua-boatshed.jpg'
            },
            {
                name: 'Christchurch Adventure Park',
                description: 'Ziplining, MTB trails with chairlift access and scenic views.',
                link: 'https://www.chchadventurepark.com/',
                image: 'adventure-park.jpg'
            },
            {
                name: 'Christchurch Gondola',
                description: 'Scenic ride to the top of the Port Hills with panoramic views.',
                link: 'https://www.gondola.co.nz/',
                image: 'gondola.jpg'
            },
            {
                name: 'Christchurch Tram',
                description: 'Historic city circuit with hop-on, hop-off access to major attractions.',
                link: 'https://www.welcometochristchurch.co.nz/tram',
                image: 'christchurch-tram.jpg'
            },
            {
                name: 'Clip \'n Climb',
                description: 'Indoor rock climbing with colorful, themed climbing walls.',
                link: 'https://www.clipnclimbchristchurch.co.nz/',
                image: 'clip-climb.jpg'
            },
            {
                name: 'Delta Force Paintball',
                description: 'Outdoor paintball course with various game scenarios.',
                link: 'https://www.deltaforce.co.nz/christchurch/',
                image: 'delta-paintball.jpg'
            },
            {
                name: 'Ferrymead Paintball',
                description: 'Paintball skirmishes in a heritage park setting.',
                link: 'https://ferrymeadpaintball.co.nz/',
                image: 'ferrymead-paintball.jpg'
            },
            {
                name: 'Flip Out',
                description: 'Trampoline park with various zones and activities.',
                link: 'https://flipout.co.nz/christchurch',
                image: 'flip-out.jpg'
            },
            {
                name: 'Laser Strike',
                description: 'Laser tag arena with multi-level playing fields.',
                link: 'https://www.laserstrike.co.nz/',
                image: 'laser-strike.jpg'
            },
            {
                name: 'McLeans Island Paintball',
                description: 'Paintball in a forest environment with different game fields.',
                link: 'https://www.mcleansisland.com/paintball',
                image: 'mcleans-paintball.jpg'
            },
            {
                name: 'Supa Karts',
                description: 'Indoor go-karting with electric karts and timing systems.',
                link: 'https://www.supakarts.co.nz/',
                image: 'supa-karts.jpg'
            },
            {
                name: 'Velocity Karts',
                description: 'Outdoor go-karting on a professional track.',
                link: 'https://www.velocitykarts.co.nz/',
                image: 'velocity-karts.jpg'
            },
            {
                name: 'Adrenalin Forest',
                description: 'High ropes course with multiple difficulty levels through the trees.',
                link: 'https://www.adrenalin-forest.co.nz/',
                image: 'adrenalin-forest.jpg'
            },
            {
                name: 'Escape Rooms',
                description: 'Interactive adventures with themed puzzle rooms to solve.',
                link: '#',
                image: 'escape-rooms.jpg'
            },
            {
                name: 'International Antarctic Centre',
                description: 'Experience Antarctic storms, meet penguins, and learn about polar research.',
                link: 'https://www.iceberg.co.nz/',
                image: 'antarctic-centre.jpg'
            },
            {
                name: 'Punting on the Avon',
                description: 'Traditional flat-bottom boat rides along the scenic Avon River.',
                link: 'https://www.punting.co.nz/',
                image: 'punting-avon.jpg'
            }
        ]
    },
    {
        id: 'beaches-coastal',
        name: 'Beaches & Coastal',
        places: [
            {
                name: 'Lyttleton Harbour',
                description: 'Coastal area, scenic views, historic port town with cafes and galleries.',
                link: 'https://www.lytteltonharbour.info/',
                image: 'lyttelton-harbour.jpg'
            },
            {
                name: 'New Brighton Beach',
                description: 'Pier & hot pools with stunning ocean views and surf culture.',
                link: 'https://www.christchurchnz.com/experience/new-brighton-pier/',
                image: 'new-brighton.jpg'
            },
            {
                name: 'Quail Island',
                description: 'Lyttleton Harbour island with walking tracks and historic sites.',
                link: 'https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/quail-island-otamahua-recreation-reserve/',
                image: 'quail-island.jpg'
            },
            {
                name: 'Scarborough Beach',
                description: 'Popular surf beach with dramatic cliffs and coastal walks.',
                link: 'https://www.christchurchnz.com/experience/scarborough-beach/',
                image: 'scarborough-beach.jpg'
            },
            {
                name: 'Sumner Beach & Cave Rock',
                description: 'Scenic coastal walk, surfing spot with iconic rock formation.',
                link: 'https://www.christchurchnz.com/experience/sumner-beach/',
                image: 'sumner-beach.jpg'
            },
            {
                name: 'Taylors Mistake Beach',
                description: 'Secluded cove popular with surfers and walkers.',
                link: 'https://www.christchurchnz.com/experience/taylors-mistake/',
                image: 'taylors-mistake.jpg'
            },
            {
                name: 'Corsair Bay',
                description: 'Great for swimming or a relaxing picnic in a sheltered bay.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-parks/corsair-bay',
                image: 'corsair-bay.jpg'
            },
            {
                name: 'Godley Head',
                description: 'Coastal walks with historic WWII gun emplacements and panoramic views.',
                link: 'https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/godley-head-recreation-reserve/',
                image: 'godley-head.jpg'
            },
            {
                name: 'Rapaki Track',
                description: 'Popular walking and mountain biking track with spectacular harbour views.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/walking-and-hiking-in-christchurch/port-hills-walks/rapaki-track',
                image: 'rapaki-track.jpg'
            }
        ]
    },
    {
        id: 'family-friendly',
        name: 'Family-Friendly',
        places: [
            {
                name: 'Christchurch International Antarctic Centre',
                description: 'Interactive Antarctic experience with penguins, Hagglund rides and storm chamber.',
                link: 'https://www.iceberg.co.nz/',
                image: 'antarctic-centre.jpg'
            },
            {
                name: 'Margaret Mahy Family Playground',
                description: 'Large themed playground with water play, slides, and climbing structures.',
                link: 'https://www.ccc.govt.nz/parks-and-gardens/christchurch-attractions/margaret-mahy-family-playground',
                image: 'margaret-mahy.jpg'
            },
            {
                name: 'Mini Golf',
                description: 'Multiple venues available including indoor glow-in-the-dark courses.',
                link: '#',
                image: 'mini-golf.jpg'
            },
            {
                name: 'Trampoline Parks',
                description: 'Various locations with wall-to-wall trampolines and foam pits.',
                link: '#',
                image: 'trampoline-parks.jpg'
            },
            {
                name: 'Science Alive!',
                description: 'Interactive science museum with hands-on exhibits for all ages.',
                link: 'https://www.sciencealive.co.nz/',
                image: 'science-alive.jpg'
            },
            {
                name: 'Willowbank Wildlife Reserve',
                description: 'See native New Zealand wildlife including kiwi in natural habitats.',
                link: 'https://www.willowbank.co.nz/',
                image: 'willowbank.jpg'
            }
        ]
    },
    {
        id: 'shopping-markets',
        name: 'Shopping & Markets',
        places: [
            {
                name: 'City Centre',
                description: 'Malls, boutiques, and retail precincts including The Crossing and Ballantynes.',
                link: 'https://www.christchurchnz.com/shopping/city-centre',
                image: 'city-centre.jpg'
            },
            {
                name: 'New Regent Street',
                description: 'Colorful tram-lined street with boutique shops and cafes.',
                link: 'https://www.christchurchnz.com/experience/new-regent-street/',
                image: 'new-regent-street.jpg'
            },
            {
                name: 'Riverside Market',
                description: 'Food hall & crafts with local produce, eateries, and artisanal goods.',
                link: 'https://www.riverside.nz/',
                image: 'riverside-market.jpg'
            },
            {
                name: 'The Terrace',
                description: 'Dining precinct with restaurants and bars overlooking the Avon River.',
                link: 'https://www.theterracechristchurch.co.nz/',
                image: 'the-terrace.jpg'
            },
            {
                name: 'The Tannery',
                description: 'Boutique shopping in a restored leather tannery with unique stores.',
                link: 'https://www.thetannery.co.nz/',
                image: 'the-tannery.jpg'
            },
            {
                name: 'Riccarton Sunday Market',
                description: 'One of NZ\'s biggest outdoor markets (food, crafts, and second-hand goods).',
                link: 'https://www.riccartonmarket.co.nz/',
                image: 'riccarton-market.jpg'
            },
            {
                name: 'Op Shops',
                description: 'Second-hand stores throughout the city offering vintage finds and bargains.',
                link: '#',
                image: 'op-shops.jpg'
            },
            {
                name: 'Ballantynes',
                description: 'Historic department store with luxury brands and excellent service.',
                link: 'https://www.ballantynes.com/',
                image: 'ballantynes.jpg'
            },
            {
                name: 'Christchurch Arts Centre Market',
                description: 'Weekend markets with local arts, crafts, and food in a historic setting.',
                link: 'https://www.artscentre.org.nz/markets/',
                image: 'arts-centre-market.jpg'
            }
        ]
    },
    {
        id: 'day-trips',
        name: 'Day Trips',
        places: [
            {
                name: 'Akaroa',
                description: 'French village & dolphin tours in a picturesque harbour setting.',
                link: 'https://www.akaroa.com/',
                image: 'akaroa.jpg'
            },
            {
                name: 'Arthur\'s Pass National Park',
                description: 'Alpine hikes, stunning scenery, and native wildlife.',
                link: 'https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/arthurs-pass-national-park/',
                image: 'arthurs-pass.jpg'
            },
            {
                name: 'Hanmer Springs',
                description: 'Hot pools & forest walks in a popular alpine resort town.',
                link: 'https://www.hanmersprings.co.nz/',
                image: 'hanmer-springs.jpg'
            },
            {
                name: 'Kaikoura',
                description: 'Whale watching, dolphin encounters, and coastal scenery.',
                link: 'https://www.kaikoura.co.nz/',
                image: 'kaikoura.jpg'
            },
            {
                name: 'Mount Cook National Park',
                description: 'New Zealand\'s highest peak, glaciers, and spectacular alpine walks.',
                link: 'https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/aoraki-mount-cook-national-park/',
                image: 'mount-cook.jpg'
            }
        ]
    },
    {
        id: 'food-drink',
        name: 'Food & Drink',
        places: [
            {
                name: 'C1 Espresso',
                description: 'Pneumatic tube coffee! Famous cafe in a historic post office building.',
                link: 'https://www.c1espresso.co.nz/',
                image: 'c1-espresso.jpg'
            },
            {
                name: 'Fiddlesticks Restaurant & Bar',
                description: 'Modern NZ cuisine in an elegant setting with extensive wine list.',
                link: 'https://www.fiddlesticksbar.co.nz/',
                image: 'fiddlesticks.jpg'
            },
            {
                name: 'Pomeroy\'s Old Brewery Inn',
                description: 'Craft beer pub with cozy atmosphere and hearty food.',
                link: 'https://www.pomeroys.co.nz/',
                image: 'pomeroys.jpg'
            },
            {
                name: 'The Pedal Pusher',
                description: 'Gourmet burgers and craft beer in a cycling-themed restaurant.',
                link: 'https://www.thepedalpusher.co.nz/',
                image: 'pedal-pusher.jpg'
            },
            {
                name: 'Local Cafés',
                description: 'Unknown Chapter Coffee, Grizzly Baked Goods, and other local favorites.',
                link: '#',
                image: 'local-cafes.jpg'
            },
            {
                name: 'The Curator\'s House',
                description: 'Spanish-inspired cuisine in a historic building in the Botanic Gardens.',
                link: 'https://www.curatorshouse.co.nz/',
                image: 'curators-house.jpg'
            },
            {
                name: 'Riverside Market',
                description: 'Food hall with diverse culinary options from around the world.',
                link: 'https://www.riverside.nz/',
                image: 'riverside-market.jpg'
            }
        ]
    },
    {
        id: 'transport-tips',
        name: 'Transport Tips',
        places: [
            {
                name: 'Tram',
                description: 'Historic city loop with hop-on, hop-off access to major attractions.',
                link: 'https://www.welcometochristchurch.co.nz/tram',
                image: 'christchurch-tram.jpg'
            },
            {
                name: 'Buses',
                description: 'Metro Public Transport Hub with routes throughout the city and region.',
                link: 'https://www.metroinfo.co.nz/',
                image: 'metro-bus.jpg'
            },
            {
                name: 'Car Hire',
                description: 'Recommended for day trips (Banks Peninsula, Hanmer Springs).',
                link: '#',
                image: 'car-hire.jpg'
            },
            {
                name: 'Cycling',
                description: 'Christchurch is a flat city with many cycle ways, perfect for exploring on two wheels.',
                link: 'https://www.ccc.govt.nz/transport/cycling-and-micromobility/cycling-in-christchurch',
                image: 'cycling.jpg'
            },
            {
                name: 'Christchurch Airport',
                description: 'International and domestic flights with transport connections to the city.',
                link: 'https://www.christchurchairport.co.nz/',
                image: 'christchurch-airport.jpg'
            }
        ]
    }
];

function generateCategoryButtons() {
    const filterContainer = document.getElementById('category-filter');

    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = 'All';
    allButton.setAttribute('data-category', 'all');
    allButton.addEventListener('click', filterPlaces);
    filterContainer.appendChild(allButton);

    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category.name;
        button.setAttribute('data-category', category.id);
        button.addEventListener('click', filterPlaces);
        filterContainer.appendChild(button);
    });
}

function generatePlaceCards() {
    const container = document.getElementById('places-container');

    categories.forEach(category => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = category.id;

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
                    <h2>${category.name}</h2>
                    <span class="toggle-icon">▼</span>
                `;

        const content = document.createElement('div');
        content.className = 'category-content';

        category.places.forEach(place => {
            const card = document.createElement('div');
            card.className = 'place-card';
            card.setAttribute('data-category', category.id);

            const imageUrl = `https://source.unsplash.com/random/400x300/?${encodeURIComponent(place.name + ' christchurch')}`;

            card.innerHTML = `
                        <div class="place-image" style="background-image: url('${imageUrl}')"></div>
                        <div class="place-content">
                            <h3>${place.name}</h3>
                            <p>${place.description}</p>
                            <a href="${place.link}" class="place-link" target="_blank">Learn More</a>
                        </div>
                    `;

            content.appendChild(card);
        });

        section.appendChild(header);
        section.appendChild(content);
        container.appendChild(section);

        header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
        });
    });
}

function filterPlaces() {
    const category = this.getAttribute('data-category');

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    this.classList.add('active');

    document.querySelectorAll('.category-section').forEach(section => {
        if (category === 'all' || section.id === category) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();

        document.querySelectorAll('.place-card').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();

            if (name.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        document.querySelectorAll('.category-section').forEach(section => {
            const visibleCards = section.querySelectorAll('.place-card[style="display: block"]');
            const categoryContent = section.querySelector('.category-content');

            if (visibleCards.length === 0) {
                categoryContent.style.display = 'none';
            } else {
                categoryContent.style.display = 'grid';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    generateCategoryButtons();
    generatePlaceCards();
    setupSearch();
});