async function search(query) {
    const url = 'https://nyaa.si/?f=0&c=1_2&q=' + encodeURIComponent(query) + '&page=rss';
    try {
        const res = await fetch(url);
        const text = await res.text();
        return [];
    } catch (e) {
        return [];
    }
}
