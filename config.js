var villainTechTree = [
    {'id': 'reload', 'description': 'Traps reload faster', 'cost': 1, 'children': ['research']},
    {'id': 'research', 'description': 'More tech per level', 'cost': 1, 'children': []},
    {'id': 'cheap', 'description': 'Traps are cheaper', 'cost': 1, 'children': ['score']},
    {'id': 'score', 'description': 'Bonus points per level', 'cost': 1, 'children': []} // no effect yet
];

var events = [
    {
	'title': 'Gender Equality',
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
    }
];

// implemented modifiers: reload, research, cheap, tempReduceCurrency, minionSalaryIncrease, reduceCurrency, killMinions
// tempReduceCurrency and reduceCurrency don't work well with minions
