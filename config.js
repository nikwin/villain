var villainTechTree = [
    {'id': 'reload', 'description': 'Traps reload faster', 'cost': 1, 'children': ['research']},
    {'id': 'research', 'description': 'More tech per level', 'cost': 1, 'children': []},
    {'id': 'cheap', 'description': 'Traps are cheaper', 'cost': 1, 'children': ['score']},
    {'id': 'score', 'description': 'Bonus points per level', 'cost': 1, 'children': []} // no effect yet
];

var events = {
    'henchpeople': {
	'title': 'Gender Equality',
	'text': 'Some of your female henchmen are displeased with the terminology and are demanding you refer to them as henchpeople.',
	'options': [
	    {'text': 'Fine. All genders are equal to me - AS MY SLAVES!', 'effect': 'henchpeople'},
	    {'text': 'I do not have time for this.', 'effect': 'tempReduceCurrency|minions:2'}
	]
    }
};

var temporaryModifiers = [
    'tempReduceCurrency'
];

// implemented modifiers: reload, research, cheap, tempReduceCurrency, minionSalaryIncrease
