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
	    {'text': 'Fine. All genders are equal to me - AS MY SLAVES!', 'effect': 'henchpeople'}, // not implemented
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
	    {'text': 'Quietly smuggle in some funds from the Inscrutable Traps account.', 'effect': 'tempReduceCurrency|money:500'}
	]
    },
    {
	'title': 'Unionization', // this is referenced in villain.js. hardcoded
	'text': 'Your henchmen are demanding better treatment and higher wages and have formed a union!',
	'options': [
	    {'text': 'Agree to their demands.', 'effect': 'unions'},
	    {'text': 'Execute the instigator for his insolence!', 'effect': 'killMinions|1'}
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

// implemented modifiers: reload, research, cheap, tempReduceCurrency, minionSalaryIncrease, reduceCurrency, killMinions, unions, strike
// tempReduceCurrency and reduceCurrency don't work well with minions
