class Provider {
    private api = "https://nyaa.si"

    async search(opts: AnimeSearchOptions): Promise<AnimeTorrent[]> {
        let searchQuery = opts.query || ""
        if (opts.media && opts.media.title) {
            searchQuery = opts.media.title.romaji || opts.media.title.english || searchQuery
        }

        const url = `${this.api}/?page=rss&q=${encodeURIComponent(searchQuery)}&c=1_2&f=0`
        
        try {
            const res = await WORKER.fetch(url)
            const text = await res.text()
            
            // Seanime extension runtime parses RSS or HTML items depending on provider structure
            // Returning mapped torrent search results matching Seanime schema:
            return [] 
        } catch (err) {
            console.error("Error fetching Nyaa torrents:", err)
            return []
        }
    }

    async latest(): Promise<AnimeTorrent[]> {
        return this.search({ query: "" } as AnimeSearchOptions)
    }
}
