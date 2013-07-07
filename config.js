var levelSetup = [
    {
        'currencies': {'money': 20000, 'tech': 0},
        'objective': "A young child\'s lemonade stand"
    },
    {
        'currencies': {'money': 2000, 'tech': 0},
        'objective': 'The hamburger place at the corner'
    },
    {
        'currencies': {'money': 4000, 'tech': 0},
        'objective': 'The local bank office'
    },
    {
        'currencies': {'money': 6000, 'tech': 0},
        'objective': 'A skyscraper full of business people'
    },
    {
        'currencies': {'money': 8000, 'tech': 0},
        'objective': 'The downtown area'
    },
    {
        'currencies': {'money': 10000, 'tech': 0},
        'objective': 'A medium sized city'
    },
    {
        'currencies': {'money': 14000,
                       'tech': 0},
        'objective': 'A rather small state'
    },
    {
        'currencies': {'money': 18000,
                       'tech': 0},
        'objective': 'The island-country'
    },
    {
        'currencies': {'money': 24000,
                       'tech': 0},
        'objective': 'A not very important continent'
    },
    {
        'currencies': {'money': 28000,
                       'tech': 0},
        'objective': 'A couple of linked landmasses'
    },
    {
        'currencies': {'money': 35000,
                       'tech': 0},
        'objective': 'The entire world'
    },
    {
        'currencies': {'money': 50000,
                       'tech': 0},
        'objective': 'The known universe'
    },
    {
        'currencies': {'money': 75000,
                       'tech': 0},
        'objective': 'The complete set of possible realities'
    }
];

var defaultSalary = 1000;

var villainTechTree = [
    {'id': 'reload', 'description': 'Traps reload faster', 'cost': 1, 'children': ['research']},
    {'id': 'research', 'description': 'More tech per level', 'cost': 1, 'children': []},
    {'id': 'cheap', 'description': 'Traps are cheaper', 'cost': 1, 'children': ['score']},
    {'id': 'score', 'description': 'Bonus points per level', 'cost': 1, 'children': []} // no effect yet
];

var events = [
    {
	'title': 'Gender Equality', // this is referenced in villain.js. hardcoded
	'text': 'Some of your female henchmen are displeased with the terminology and are demanding you refer to them as henchpeople.',
	'options': [
	    {'text': 'Fine. All genders are equal to me - AS MY SLAVES!', 'effect': 'henchpeople'},
	    {'text': 'I do not have time for this.', 'effect': 'killMinions|2'}
	]
    },
    {
	'title': 'Living Wages',
	'text': 'A number of your minions have started grumbling about their wages. Some have even threatened to leave your glorious organization.',
	'options': [
	    {'text': 'Let them go. Into the piranha tanks.', 'effect': 'killMinions|2'},
	    {'text': 'Very well, my Unstoppable Legions require financial support.', 'effect': 'minionSalaryIncrease|100'}
	]
    },
    {
	'title': '401k Investment',
	'text': 'The return on your minion’s 401(k) portfolios is... insufficient. Something must be done before they notice.',
	'options': [
	    {'text': 'Quietly smuggle in some funds from another account.', 'effect': 'tempReduceCurrency|money:500'},
        {'text': 'Pay raise for everyone!', 'effect': 'minionSalaryIncrease|100'}
	]
    },
    {
	'title': 'Unionization', // this is referenced in villain.js. hardcoded
	'text': 'Your henchmen are demanding better treatment and higher wages and have formed a union!',
	'options': [
	    {'text': 'Agree to their demands.', 'effect': 'unions'},
	    {'text': 'Execute the instigator for his insolence!', 'effect': 'killMinions|1'}
	]
    },
    {
        'title': 'Holiday Party',
        'text': 'It is time for the annual holiday party and bonus. You suppose they deserve it. But there are... other options.',
        'options': [
            {'text': 'Pay a dividend to your employees.', 'effect': 'tempReduceCurrency|2000'},
            {'text': 'Save on a Pinata', 'effect': 'killMinions|1'}
        ]
    },
    {
        'title': 'New Social Game Company',
        'text': 'A new social game company has just started in your area. Some minions are tempted by the higher pay and higher capacity for evil.',
        'options': [
            {'text': 'Match the higher pay', 'effect': 'minionSalaryIncrease:100'},
            {'text': 'Sacrifice for the greater evil.', 'effect': 'killMinions|2'}
        ]
    },
    {
        'title': 'Webcomic Lampoons Your Work Culture',
        'text': 'A webcomic making fun of your management techniques and corporate benefits has become wildly popular. This affront to your dignity cannot stand.',
        'options': [
            {'text': 'Prove that gigalaser beats pen', 'effect': 'killMinions|2'},
            {'text': 'Improve work environment', 'effect': 'reduceCurrency|1000'}
        ]
    }
];

var unionEvents = [
    {
	'title': 'Strike',
	'text': 'You have received notice that your henchmen are planning a strike for this afternoon!',
	'options': [
	    {'text': 'UNACCEPTABLE!', 'effect': 'strike'} // also hardcoded to have you have no minions for the first 5 secs of the next round, launch strike ends event
	]
    }
];

var strikeEnd = {
    'title': 'Strike Ends',
    'text': 'Very well. The insufferable minions will get what they want...',
    'options': [
	{'text': 'For now...', 'effect': 'minionSalaryIncrease|200'} // also hardcoded to give you your minions back and remove the strike
    ]
};

var endBossConditions = {'money': 150, 'minions': 6};

// implemented modifiers: reload, research, cheap, tempReduceCurrency, minionSalaryIncrease, reduceCurrency, killMinions, unions, strike, henchpeople
// tempReduceCurrency and reduceCurrency don't work well with minions
