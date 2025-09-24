// Script to verify the dropdown is populated correctly
// Run this in the browser console after the page loads

setTimeout(() => {
    const dropdown = document.getElementById('startingPoint');
    if (dropdown) {
        console.log('Dropdown found!');
        console.log('Number of options:', dropdown.options.length);
        console.log('First 5 options:');
        for (let i = 0; i < Math.min(5, dropdown.options.length); i++) {
            console.log(`  ${i}: ${dropdown.options[i].text} (value: ${dropdown.options[i].value})`);
        }
        
        if (dropdown.options.length <= 1) {
            console.error('Dropdown is not populated! Checking variables...');
            console.log('buildingsData exists?', typeof window.buildingsData !== 'undefined');
            console.log('buildingsData length:', window.buildingsData ? window.buildingsData.length : 0);
            console.log('populateStartingPointDropdown exists?', typeof window.populateStartingPointDropdown !== 'undefined');
            
            if (typeof window.populateStartingPointDropdown === 'function') {
                console.log('Manually calling populateStartingPointDropdown()...');
                window.populateStartingPointDropdown();
                console.log('After manual call, dropdown options:', dropdown.options.length);
            }
        }
    } else {
        console.error('Dropdown not found!');
    }
}, 3000);