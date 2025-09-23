const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 
    });
    const page = await browser.newPage();
    
    // Add console listener to capture errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console error:', msg.text());
        }
    });
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Wait for map to load
    await page.waitForSelector('#map', { timeout: 10000 });
    console.log('✓ Map container loaded');
    
    // Wait for building list
    await page.waitForSelector('#buildingList', { timeout: 10000 });
    console.log('✓ Building list container loaded');
    
    // Wait a bit for geocoding to start
    await page.waitForTimeout(3000);
    
    // Check how many building items are created
    const buildingItems = await page.$$('.building-item');
    console.log(`\n📍 Number of building items in DOM: ${buildingItems.length}`);
    
    // Check how many are visible
    const visibleBuildings = await page.evaluate(() => {
        const items = document.querySelectorAll('.building-item');
        let visible = 0;
        items.forEach(item => {
            if (item.style.display !== 'none') {
                visible++;
            }
        });
        return visible;
    });
    console.log(`👁️  Number of visible buildings: ${visibleBuildings}`);
    
    // Get the visible count from the UI
    const visibleCountText = await page.textContent('#visibleCount');
    console.log(`📊 Visible count text: ${visibleCountText}`);
    
    // Get total buildings count
    const totalCount = await page.textContent('#buildingCount');
    console.log(`📊 Total buildings count: ${totalCount}`);
    
    // Get geocoded buildings count
    const geocodedCount = await page.textContent('#geocodedBuildings');
    console.log(`📊 Geocoded buildings: ${geocodedCount}`);
    
    // Check markers on the map
    const markersInfo = await page.evaluate(() => {
        if (typeof markers !== 'undefined') {
            return {
                total: markers.length,
                withPosition: markers.filter(m => m && m.getPosition).length
            };
        }
        return { total: 0, withPosition: 0 };
    });
    console.log(`\n🗺️  Markers on map: ${markersInfo.total}`);
    console.log(`📍 Markers with position: ${markersInfo.withPosition}`);
    
    // Get first few building addresses to check
    const firstBuildings = await page.evaluate(() => {
        const items = document.querySelectorAll('.building-item');
        const first5 = [];
        for (let i = 0; i < Math.min(5, items.length); i++) {
            const h4 = items[i].querySelector('h4');
            first5.push({
                address: h4 ? h4.textContent : 'N/A',
                display: items[i].style.display,
                hasCheckbox: !!items[i].querySelector('.building-checkbox')
            });
        }
        return first5;
    });
    
    console.log('\n📋 First 5 buildings in list:');
    firstBuildings.forEach((b, i) => {
        console.log(`  ${i+1}. ${b.address} - Display: ${b.display || 'block'}, Has checkbox: ${b.hasCheckbox}`);
    });
    
    // Check if geocoding is still running
    const loadingIndicator = await page.$('.loading-indicator');
    if (loadingIndicator) {
        const loadingText = await loadingIndicator.textContent();
        console.log(`\n⏳ Loading indicator present: ${loadingText}`);
    } else {
        console.log('\n✓ No loading indicator, geocoding should be complete');
    }
    
    // Wait a bit more to see if more buildings load
    console.log('\n⏳ Waiting 5 more seconds to see if more buildings appear...');
    await page.waitForTimeout(5000);
    
    // Check again
    const buildingItemsAfter = await page.$$('.building-item');
    console.log(`\n📍 Number of building items after wait: ${buildingItemsAfter.length}`);
    
    const markersInfoAfter = await page.evaluate(() => {
        if (typeof markers !== 'undefined') {
            return markers.length;
        }
        return 0;
    });
    console.log(`🗺️  Markers on map after wait: ${markersInfoAfter}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'map-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as map-debug.png');
    
    await browser.close();
})();