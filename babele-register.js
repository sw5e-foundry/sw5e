Hooks.once('init', () => {
	if(typeof Babele !== 'undefined') {
		Babele.get().setSystemTranslationsDir("babele");

	}
});