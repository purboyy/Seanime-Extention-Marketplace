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
            return this.parseRss(text)
        } catch (err) {
            console.error("Error fetching Nyaa RSS:", err)
            return []
        }
    }

    async latest(): Promise<AnimeTorrent[]> {
        return this.search({ query: "" } as AnimeSearchOptions)
    }

    private parseRss(xml: string): AnimeTorrent[] {
        const torrents: AnimeTorrent[] = []
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g)

        if (!items) return torrents

        for (const item of items) {
            const getTag = (tag: string) => {
                const match = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`))
                return match ? (match[1] || match[2] || "").trim() : ""
            }

            const title = getTag("title")
            const link = getTag("link")
            const pubDate = getTag("pubDate")
            
            const seeders = parseInt(getTag("nyaa:seeders") || "0", 10)
            const leechers = parseInt(getTag("nyaa:leechers") || "0", 10)
            const size = getTag("nyaa:size") || "0 MB"
            const infoHash = getTag("nyaa:infoHash")
            
            let magnet = getTag("nyaa:magnetHash")
            if (!magnet && infoHash) {
                magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`
            }

            if (title) {
                torrents.push({
                    id: link || title,
                    name: title,
                    url: link,
                    magnet: magnet,
                    size: size,
                    seeders: seeders,
                    leechers: leechers,
                    episodeNumber: 0,
                })
            }
        }

        return torrents
    }
}
