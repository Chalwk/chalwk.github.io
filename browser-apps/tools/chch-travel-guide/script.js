/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Christchurch Travel Guide - JavaScript
*/

const categories = [
    {
        id: 'cultural-historical',
        name: 'Cultural & Historical',
        places: [
            {
                name: 'Arts Centre',
                description: 'Historic Gothic Revival complex with galleries, studios, and weekend markets.',
                link: 'https://www.google.com/maps/search/?api=1&query=Arts+Centre+Christchurch+New+Zealand'
            },
            {
                name: 'BNZ Centre',
                description: 'City Centre architecture featuring modern design elements.',
                link: 'https://www.google.com/maps/search/?api=1&query=BNZ+Centre+Christchurch+New+Zealand'
            },
            {
                name: 'Canterbury Museum',
                description: 'Māori artifacts & Antarctic exhibits showcasing regional history and exploration.',
                link: 'https://www.google.com/maps/search/?api=1&query=Canterbury+Museum+Christchurch+New+Zealand'
            },
            {
                name: 'Canterbury Earthquake National Memorial',
                description: 'Tribute to 2011 quake victims, a place for reflection and remembrance.',
                link: 'https://www.google.com/maps/search/?api=1&query=Canterbury+Earthquake+National+Memorial+Christchurch'
            },
            {
                name: 'Cathedral Square',
                description: 'Iconic city centre landmark with historic significance and events.',
                link: 'https://www.google.com/maps/search/?api=1&query=Cathedral+Square+Christchurch+New+Zealand'
            },
            {
                name: 'Ferrymead Heritage Park',
                description: 'Living history museum with tram rides and historic displays.',
                link: 'https://www.google.com/maps/search/?api=1&query=Ferrymead+Heritage+Park+Christchurch'
            },
            {
                name: 'Quake City',
                description: 'Earthquake Museum telling the story of the Canterbury earthquakes.',
                link: 'https://www.google.com/maps/search/?api=1&query=Quake+City+Christchurch+New+Zealand'
            },
            {
                name: 'Riccarton House & Bush',
                description: 'Historic homestead & trails through native forest.',
                link: 'https://www.google.com/maps/search/?api=1&query=Riccarton+House+Bush+Christchurch'
            },
            {
                name: 'Sign of the Takahe',
                description: 'Heritage building with panoramic views, available for functions.',
                link: 'https://www.google.com/maps/search/?api=1&query=Sign+of+the+Takahe+Christchurch'
            },
            {
                name: 'Cardboard Cathedral',
                description: 'Formally Transitional Cathedral, an architectural marvel built after the earthquakes.',
                link: 'https://www.google.com/maps/search/?api=1&query=Cardboard+Cathedral+Christchurch'
            },
            {
                name: 'Air Force Museum of New Zealand',
                description: 'Military aviation history with vintage aircraft and interactive exhibits.',
                link: 'https://www.google.com/maps/search/?api=1&query=Air+Force+Museum+of+New+Zealand+Christchurch'
            },
            {
                name: 'Victoria Clock Tower',
                description: 'Beautifully restored historic landmark in the city centre.',
                link: 'https://www.google.com/maps/search/?api=1&query=Victoria+Clock+Tower+Christchurch'
            },
            {
                name: 'Bridge of Remembrance',
                description: 'Iconic war memorial with great photo spots and historical significance.',
                link: 'https://www.google.com/maps/search/?api=1&query=Bridge+of+Remembrance+Christchurch'
            },
            {
                name: 'Christchurch Art Gallery',
                description: 'Contemporary art gallery with impressive collections and architecture.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Art+Gallery+New+Zealand'
            },
            {
                name: 'New Regent Street Precinct',
                description: 'Colorful Spanish Mission-style street with boutique shops and cafes.',
                link: 'https://www.google.com/maps/search/?api=1&query=New+Regent+Street+Precinct+Christchurch'
            },
            {
                name: 'Tūranga Library',
                description: 'Central library with modern architecture and community spaces.',
                link: 'https://www.google.com/maps/search/?api=1&query=Tūranga+Central+Library+Christchurch'
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
                link: 'https://www.google.com/maps/search/?api=1&query=Avon+River+Christchurch+New+Zealand'
            },
            {
                name: 'Banks Peninsula',
                description: 'Scenic drives & hikes through volcanic landscapes with stunning coastal views.',
                link: 'https://www.google.com/maps/search/?api=1&query=Banks+Peninsula+New+Zealand'
            },
            {
                name: 'Christchurch Botanic Gardens',
                description: 'Rose garden, conservatory, aviary, cafe, walks through beautifully maintained gardens.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Botanic+Gardens'
            },
            {
                name: 'Bottle Lake Forest',
                description: 'Mountain biking & walks through pine forest with coastal access.',
                link: 'https://www.google.com/maps/search/?api=1&query=Bottle+Lake+Forest+Christchurch'
            },
            {
                name: 'Hagley Park North',
                description: 'Gardens, golf course, sports fields in the heart of the city.',
                link: 'https://www.google.com/maps/search/?api=1&query=Hagley+Park+North+Christchurch'
            },
            {
                name: 'Hagley Park South',
                description: 'Gardens, golf course, sports fields in the heart of the city.',
                link: 'https://www.google.com/maps/search/?api=1&query=Hagley+Park+South+Christchurch'
            },
            {
                name: 'Halswell Quarry',
                description: 'Walking trails through former quarry with interesting geological features.',
                link: 'https://www.google.com/maps/search/?api=1&query=Halswell+Quarry+Christchurch'
            },
            {
                name: 'McLeans Forest',
                description: 'Mountain biking trails for all skill levels in native bush setting.',
                link: 'https://www.google.com/maps/search/?api=1&query=McLeans+Forest+Christchurch'
            },
            {
                name: 'National Equestrian Centre (NEC)',
                description: 'Horse riding facilities and trails through scenic landscapes.',
                link: 'https://www.google.com/maps/search/?api=1&query=National+Equestrian+Centre+Christchurch'
            },
            {
                name: 'Orana Wildlife Park',
                description: 'Open-range zoo with New Zealand\'s only gorillas and many native species.',
                link: 'https://www.google.com/maps/search/?api=1&query=Orana+Wildlife+Park+Christchurch'
            },
            {
                name: 'Port Hills',
                description: 'Panoramic views of the city, Lyttelton Harbour and the Southern Alps.',
                link: 'https://www.google.com/maps/search/?api=1&query=Port+Hills+Christchurch'
            },
            {
                name: 'Travis Wetland Nature Heritage Park',
                description: 'Birdwatching in one of Christchurch\'s largest freshwater wetlands.',
                link: 'https://www.google.com/maps/search/?api=1&query=Travis+Wetland+Christchurch'
            },
            {
                name: 'Willowbank Wildlife Reserve',
                description: 'Native NZ species including kiwi in natural habitat settings.',
                link: 'https://www.google.com/maps/search/?api=1&query=Willowbank+Wildlife+Reserve+Christchurch'
            },
            {
                name: 'Mona Vale Garden Park',
                description: 'Historic homestead with beautiful gardens, perfect for a peaceful stroll.',
                link: 'https://www.google.com/maps/search/?api=1&query=Mona+Vale+Garden+Park+Christchurch'
            },
            {
                name: 'Christchurch Gondola',
                description: 'Scenic cable car ride to the top of the Port Hills with breathtaking views.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Gondola'
            }
        ]
    },
    {
        id: 'adventure-activities',
        name: 'Adventure & Activities',
        places: [
            {
                name: 'Alpine Ice Sports Centre',
                description: 'Indoor ice skating for all ages and skill levels.',
                link: 'https://www.google.com/maps/search/?api=1&query=Alpine+Ice+Sports+Centre+Christchurch'
            },
            {
                name: 'Antigua Boat Shed',
                description: 'Punting/canoe hire on the Avon River in historic boat sheds.',
                link: 'https://www.google.com/maps/search/?api=1&query=Antigua+Boat+Sheds+Christchurch'
            },
            {
                name: 'Christchurch Adventure Park',
                description: 'Ziplining, MTB trails with chairlift access and scenic views.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Adventure+Park'
            },
            {
                name: 'Christchurch Tram',
                description: 'Historic city circuit with hop-on, hop-off access to major attractions.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Tram+109+Worcester+Street+Christchurch+Central+City+8011'
            },
            {
                name: 'Clip \'n Climb',
                description: 'Indoor rock climbing with colorful, themed climbing walls.',
                link: 'https://www.google.com/maps/search/?api=1&query=Clip+n+Climb+Christchurch'
            },
            {
                name: 'Ferrymead Paintball',
                description: 'Paintball skirmishes in a heritage park setting.',
                link: 'https://www.google.com/maps/search/?api=1&query=Ferrymead+Paintball+Christchurch'
            },
            {
                name: 'MoveX Trampoline and Ninja Park',
                description: 'Trampoline park with various zones and activities.',
                link: 'https://www.google.com/maps/search/?api=1&query=MoveX+Trampoline+Ninja+Park+Christchurch'
            },
            {
                name: 'Laser Strike',
                description: 'Laser tag arena with multi-level playing fields.',
                link: 'https://www.google.com/maps/search/?api=1&query=Laser+Strike+Christchurch'
            },
            {
                name: 'MCLEANS ISLAND PAINTBALL',
                description: 'Paintball in a forest environment with different game fields.',
                link: 'https://www.google.com/maps/search/?api=1&query=McLeans+Island+Paintball+Christchurch'
            },
            {
                name: 'Supa Karts',
                description: 'Indoor go-karting with electric karts and timing systems.',
                link: 'https://www.google.com/maps/search/?api=1&query=Supa+Karts+Christchurch'
            },
            {
                name: 'Velocity Karts',
                description: 'Outdoor go-karting on a professional track.',
                link: 'https://www.google.com/maps/search/?api=1&query=Velocity+Karts+Christchurch'
            },
            {
                name: 'Adrenalin Forest',
                description: 'High ropes course with multiple difficulty levels through the trees.',
                link: 'https://www.google.com/maps/search/?api=1&query=Adrenalin+Forest+Christchurch'
            },
            {
                name: 'Escape Rooms',
                description: 'Interactive adventures with themed puzzle rooms to solve.',
                link: 'https://www.google.com/maps/search/?api=1&query=Escape+Rooms+Christchurch'
            },
            {
                name: 'Punting on the Avon',
                description: 'Traditional flat-bottom boat rides along the scenic Avon River.',
                link: 'https://www.google.com/maps/search/?api=1&query=Punting+on+the+Avon+Christchurch'
            },
            {
                name: 'Boulder Co. Christchurch',
                description: 'Rock climbing gym with bouldering walls.',
                link: 'https://www.google.com/maps/search/?api=1&query=Boulder+Co+Christchurch'
            },
            {
                name: 'Uprising Rock Climbing Gym',
                description: 'Comprehensive rock climbing facility for all skill levels.',
                link: 'https://www.google.com/maps/search/?api=1&query=Uprising+Rock+Climbing+Gym+Christchurch'
            }
        ]
    },
    {
        id: 'beaches-coastal',
        name: 'Beaches & Coastal',
        places: [
            {
                name: 'Lyttelton Harbour',
                description: 'Coastal area, scenic views, historic port town with cafes and galleries.',
                link: 'https://www.google.com/maps/search/?api=1&query=Lyttelton+Harbour+Christchurch'
            },
            {
                name: 'New Brighton Beach',
                description: 'Pier & hot pools with stunning ocean views and surf culture.',
                link: 'https://www.google.com/maps/search/?api=1&query=New+Brighton+Beach+Christchurch'
            },
            {
                name: 'Quail Island',
                description: 'Lyttleton Harbour island with walking tracks and historic sites.',
                link: 'https://www.google.com/maps/search/?api=1&query=Quail+Island+Christchurch'
            },
            {
                name: 'Scarborough Beach',
                description: 'Popular surf beach with dramatic cliffs and coastal walks.',
                link: 'https://www.google.com/maps/search/?api=1&query=Scarborough+Beach+Christchurch'
            },
            {
                name: 'Sumner Beach',
                description: 'Scenic coastal walk, surfing spot with iconic rock formation.',
                link: 'https://www.google.com/maps/search/?api=1&query=Sumner+Beach+Christchurch'
            },
            {
                name: 'Taylors Mistake Beach',
                description: 'Secluded cove popular with surfers and walkers.',
                link: 'https://www.google.com/maps/search/?api=1&query=Taylors+Mistake+Beach+Christchurch'
            },
            {
                name: 'Corsair Bay',
                description: 'Great for swimming or a relaxing picnic in a sheltered bay.',
                link: 'https://www.google.com/maps/search/?api=1&query=Corsair+Bay+Lyttelton'
            },
            {
                name: 'Godley Head',
                description: 'Coastal walks with historic WWII gun emplacements and panoramic views.',
                link: 'https://www.google.com/maps/search/?api=1&query=Godley+Head+Christchurch'
            },
            {
                name: 'Rapaki track',
                description: 'Popular walking and mountain biking track with spectacular harbour views.',
                link: 'https://www.google.com/maps/search/?api=1&query=Rapaki+Track+Christchurch'
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
                link: 'https://www.google.com/maps/search/?api=1&query=International+Antarctic+Centre+Christchurch'
            },
            {
                name: 'Margaret Mahy Family Playground',
                description: 'Large themed playground with water play, slides, and climbing structures.',
                link: 'https://www.google.com/maps/search/?api=1&query=Margaret+Mahy+Family+Playground+Christchurch'
            },
            {
                name: 'Volcano Park Mini Golf',
                description: 'Mini golf with volcanic theme, perfect for family fun.',
                link: 'https://www.google.com/maps/search/?api=1&query=Volcano+Park+Mini+Golf+Christchurch'
            },
            {
                name: 'MoveX Trampoline and Ninja Park',
                description: 'Various locations with wall-to-wall trampolines and foam pits.',
                link: 'https://www.google.com/maps/search/?api=1&query=MoveX+Trampoline+Ninja+Park+Christchurch'
            },
            {
                name: 'Willowbank Wildlife Reserve',
                description: 'See native New Zealand wildlife including kiwi in natural habitats.',
                link: 'https://www.google.com/maps/search/?api=1&query=Willowbank+Wildlife+Reserve+Christchurch'
            },
            {
                name: 'Spencer Park Adventure Playground',
                description: 'Large playground with unique play structures and green spaces.',
                link: 'https://www.google.com/maps/search/?api=1&query=Spencer+Park+Adventure+Playground+Christchurch'
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
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+City+Centre+Shopping'
            },
            {
                name: 'Riverside Market',
                description: 'Food hall & crafts with local produce, eateries, and artisanal goods.',
                link: 'https://www.google.com/maps/search/?api=1&query=Riverside+Market+Christchurch'
            },
            {
                name: 'The Terrace',
                description: 'Dining precinct with restaurants and bars overlooking the Avon River.',
                link: 'https://www.google.com/maps/search/?api=1&query=The+Terrace+Christchurch'
            },
            {
                name: 'The Tannery',
                description: 'Boutique shopping in a restored leather tannery with unique stores.',
                link: 'https://www.google.com/maps/search/?api=1&query=The+Tannery+Christchurch'
            },
            {
                name: 'Riccarton Sunday Market',
                description: 'One of NZ\'s biggest outdoor markets (food, crafts, and second-hand goods).',
                link: 'https://www.google.com/maps/search/?api=1&query=Riccarton+Sunday+Market+Christchurch'
            },
            {
                name: 'Op Shops',
                description: 'Second-hand stores throughout the city offering vintage finds and bargains.',
                link: 'https://www.google.com/maps/search/?api=1&query=Op+Shops+Christchurch'
            },
            {
                name: 'Ballantynes',
                description: 'Historic department store with luxury brands and excellent service.',
                link: 'https://www.google.com/maps/search/?api=1&query=Ballantynes+Christchurch'
            },
            {
                name: 'Christchurch Arts Centre Market',
                description: 'Weekend markets with local arts, crafts, and food in a historic setting.',
                link: 'https://www.google.com/maps/search/?api=1&query=Arts+Centre+Market+Christchurch'
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
                link: 'https://www.google.com/maps/search/?api=1&query=Akaroa+New+Zealand'
            },
            {
                name: 'Arthur\'s Pass National Park',
                description: 'Alpine hikes, stunning scenery, and native wildlife.',
                link: 'https://www.google.com/maps/search/?api=1&query=Arthurs+Pass+National+Park+New+Zealand'
            },
            {
                name: 'Hanmer Springs',
                description: 'Hot pools & forest walks in a popular alpine resort town.',
                link: 'https://www.google.com/maps/search/?api=1&query=Hanmer+Springs+New+Zealand'
            },
            {
                name: 'Kaikoura',
                description: 'Whale watching, dolphin encounters, and coastal scenery.',
                link: 'https://www.google.com/maps/search/?api=1&query=Kaikoura+New+Zealand'
            },
            {
                name: 'Mount Cook National Park',
                description: 'New Zealand\'s highest peak, glaciers, and spectacular alpine walks.',
                link: 'https://www.google.com/maps/search/?api=1&query=Mount+Cook+National+Park+New+Zealand'
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
                link: 'https://www.google.com/maps/search/?api=1&query=C1+Espresso+Christchurch'
            },
            {
                name: 'Fiddlesticks Restaurant & Bar',
                description: 'Modern NZ cuisine in an elegant setting with extensive wine list.',
                link: 'https://www.google.com/maps/search/?api=1&query=Fiddlesticks+Restaurant+Bar+Christchurch'
            },
            {
                name: 'Pomeroy\'s Old Brewery Inn',
                description: 'Craft beer pub with cozy atmosphere and hearty food.',
                link: 'https://www.google.com/maps/search/?api=1&query=Pomeroy+Old+Brewery+Inn+Christchurch'
            },
            {
                name: 'The Pedal Pusher',
                description: 'Gourmet burgers and craft beer in a cycling-themed restaurant.',
                link: 'https://www.google.com/maps/search/?api=1&query=Pedal+Pusher+Christchurch'
            },
            {
                name: 'Local Cafés',
                description: 'Unknown Chapter Coffee, Grizzly Baked Goods, and other local favorites.',
                link: 'https://www.google.com/maps/search/?api=1&query=Cafe+Christchurch'
            },
            {
                name: 'The Curator\'s House',
                description: 'Spanish-inspired cuisine in a historic building in the Botanic Gardens.',
                link: 'https://www.google.com/maps/search/?api=1&query=Curators+House+Christchurch'
            },
            {
                name: 'Riverside Market',
                description: 'Food hall with diverse culinary options from around the world.',
                link: 'https://www.google.com/maps/search/?api=1&query=Riverside+Market+Christchurch'
            },
            {
                name: 'Dumplings on Riccarton',
                description: 'Popular spot for authentic dumplings and Asian cuisine.',
                link: 'https://www.google.com/maps/search/?api=1&query=Dumplings+on+Riccarton+Christchurch'
            },
            {
                name: 'Coffee Zone',
                description: 'Local coffee spot known for quality brews.',
                link: 'https://www.google.com/maps/search/?api=1&query=Coffee+Zone+Christchurch'
            },
            {
                name: 'The Tea Rooms',
                description: 'Traditional tea service in a historic setting.',
                link: 'https://www.google.com/maps/search/?api=1&query=The+Tea+Rooms+Christchurch'
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
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Tram+109+Worcester+Street+Christchurch+Central+City+8011'
            },
            {
                name: 'Christchurch Bus Interchange',
                description: 'Metro Public Transport Hub with routes throughout the city and region.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Bus+Interchange'
            },
            {
                name: 'Car Hire',
                description: 'Recommended for day trips (Banks Peninsula, Hanmer Springs).',
                link: 'https://www.google.com/maps/search/?api=1&query=Car+Hire+Christchurch'
            },
            {
                name: 'Cycling',
                description: 'Christchurch is a flat city with many cycle ways, perfect for exploring on two wheels.',
                link: 'https://www.google.com/maps/search/?api=1&query=Cycle+Paths+Christchurch'
            },
            {
                name: 'Christchurch Airport',
                description: 'International and domestic flights with transport connections to the city.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Airport+New+Zealand'
            },
            {
                name: 'Christchurch Railway Station',
                description: 'Train services including the Coastal Pacific and TranzAlpine.',
                link: 'https://www.google.com/maps/search/?api=1&query=Christchurch+Railway+Station'
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

            card.innerHTML = `
                <div class="place-content">
                    <h3>${place.name}</h3>
                    <p>${place.description}</p>
                    <a href="${place.link}" class="place-link" target="_blank">View on Google Maps</a>
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