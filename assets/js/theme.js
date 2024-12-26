
class Util {
  getScrollTop() {
    return (
      (document.documentElement && document.documentElement.scrollTop) ||
      document.body.scrollTop
    );
  }

  isMobile() {
    return window.matchMedia('only screen and (max-width: 767.8px)').matches;
  }

  isTocStatic() {
    return window.matchMedia('only screen and (max-width: 1200px)').matches;
  }

  animateCSS(element, animation, reserved, callback) {
    if (!Array.isArray(animation)) animation = [animation];

    element.classList.add('animate__animated', ...animation);

    const handler = () => {
      element.classList.remove('animate__animated', ...animation);
      element.removeEventListener('animationend', handler);

      if (typeof callback === 'function') {
        callback();
      }
    };

    if (!reserved) {
      element.addEventListener('animationend', handler, false);
    }
  }
}


class Theme {
  constructor() {
    this.config = window.config;
    console.log("Config:")
    console.log(window.config)

    this.data = window.config.data;
    console.log("Config.data:")
    console.log(window.config.data)

    this.isDark = document.body.getAttribute('theme') === 'dark';
    
    this.util = new Util();
    this.newScrollTop = this.util.getScrollTop();
    this.oldScrollTop = this.newScrollTop;
    
    this.scrollEventSet = new Set();
    this.resizeEventSet = new Set();
    this.switchThemeEventSet = new Set();
    this.clickMaskEventSet = new Set();
    
    if (window.objectFitImages) objectFitImages();

    this.init();
  }

  initRaw() {
    document.querySelectorAll('[data-raw]').forEach( (raw) => {
      raw.innerHTML = this.data[raw.id];
    });
  }

  initSVGIcon() {
    document.querySelectorAll('[data-svg-src]').forEach((icon) => {
      fetch(icon.getAttribute('data-svg-src'))
        .then((response) => response.text())
        .then((svg) => {
          const temp = document.createElement('div');
          temp.insertAdjacentHTML('afterbegin', svg);
          const temp_svg = temp.firstChild;
          temp_svg.setAttribute('data-svg-src', icon.getAttribute('data-svg-src'));
          temp_svg.classList.add('icon');
          const titleElements = temp_svg.getElementsByTagName('title');
          if (titleElements.length) temp_svg.removeChild(titleElements[0]);
          icon.parentElement.replaceChild(temp_svg, icon);
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }

  initTwemoji() {
    if (this.config.twemoji) twemoji.parse(document.body);
  }

  initMenuMobile() {
    const menuToggleMobile = document.getElementById('menu-toggle-mobile');
    const menuMobile = document.getElementById('menu-mobile');

    menuToggleMobile.addEventListener('click', () => {
      document.body.classList.toggle('blur');
      menuToggleMobile.classList.toggle('active');
      menuMobile.classList.toggle('active');
    }, false);

    this._menuMobileOnClickMask = this._menuMobileOnClickMask || (() => {
      menuToggleMobile.classList.remove('active');
      menuMobile.classList.remove('active');
    });

    this.clickMaskEventSet.add(this._menuMobileOnClickMask);
  }

  initSwitchTheme() {
    // for both mobile and desktop buttons
    Array.from(document.getElementsByClassName('theme-switch')).forEach(
      (element) => {
        element.addEventListener('click', (event) => {
          if (document.body.getAttribute('theme') === 'dark') {
            document.body.setAttribute('theme', 'light');
            localStorage.setItem('theme', 'light');
            this.isDark = false;
          } else {
            document.body.setAttribute('theme', 'dark');
            localStorage.setItem('theme', 'dark');
            this.isDark = true;
          }

          // execute all events that are put into the switchThemeEventSet (i.e. also swith the mermain theme)
          for (const event of this.switchThemeEventSet) {
            event();
          }
        }, false);
      }
    );
  }


  initSearch() {
    const searchConfig = this.config.search;
    const isMobile = this.util.isMobile();

    if (!searchConfig || (isMobile && this._searchMobileOnce) || (!isMobile && this._searchDesktopOnce)) return;

    // get corresponding elements
    const suffix = isMobile ? 'mobile' : 'desktop';
    const header = document.getElementById(`header-${suffix}`);
    const searchInput = document.getElementById(`search-input-${suffix}`);
    const searchClear = document.getElementById(`search-clear-${suffix}`);
    const searchLoading = document.getElementById(`search-loading-${suffix}`);

    if (isMobile) {
      this._searchMobileOnce = true;
      this.initMobileSearch(header, searchInput, searchClear, searchLoading);
    } else {
      this._searchDesktopOnce = true;
      this.initDesktopSearch(header, searchInput, searchClear, searchLoading);
    }

    searchInput.addEventListener('input', () => {
      if (searchInput.value === '') {
        searchClear.style.display = 'none';
      } else {
        searchClear.style.display = 'inline';
      }
    }, false);

    if (searchConfig.lunrSegmentitURL && !document.getElementById('lunr-segmentit')) {
      var script = document.createElement('script');
      script.id = 'lunr-segmentit';
      script.type = 'text/javascript';
      script.src = searchConfig.lunrSegmentitURL;
      script.async = true;

      if (script.readyState) {
        script.onreadystatechange = function () {
          if (script.readyState == 'loaded' || script.readyState == 'complete') {
            script.onreadystatechange = null;
            this.initAutosearch(isMobile, searchLoading, searchClear, suffix);
          }
        };
      } else {
        script.onload = function () {
          this.initAutosearch(isMobile, searchLoading, searchClear, suffix);
        };
      }

      document.body.appendChild(script);
    } else this.initAutosearch(isMobile, searchLoading, searchClear, suffix);
  };


  initMobileSearch(header, searchInput, searchClear, searchLoading) {
    searchInput.addEventListener('focus', () => {
      document.body.classList.add('blur');
      header.classList.add('open');
    });

    document.getElementById('search-cancel-mobile').addEventListener('click', () => {
      header.classList.remove('open');
      document.body.classList.remove('blur');
      searchClear.style.display = 'none';
      searchLoading.style.display = 'none';
      this._searchMobile && this._searchMobile.autocomplete.setVal('');
    });

    searchClear.addEventListener('click', () => {
      searchClear.style.display = 'none';
      this._searchMobile && this._searchMobile.autocomplete.setVal('');
    });

    this._searchMobileOnClickMask = this._searchMobileOnClickMask || (() => {
      header.classList.remove('open');
      searchClear.style.display = 'none';
      searchLoading.style.display = 'none';
      this._searchMobile && this._searchMobile.autocomplete.setVal('');
    });

    this.clickMaskEventSet.add(this._searchMobileOnClickMask);
  }

  initDesktopSearch(header, searchInput, searchClear, searchLoading) {
    const searchToggle = document.getElementById('search-toggle-desktop');

    searchToggle.addEventListener('click', () => {
      document.body.classList.add('blur');
      header.classList.add('open');
      searchInput.focus();
      this._searchDesktop && this._searchDesktop.autocomplete.setVal('');
    });

    searchClear.addEventListener('click', () => {
      searchClear.style.display = 'none';
      this._searchDesktop && this._searchDesktop.autocomplete.setVal('');
    });

    this._searchDesktopOnClickMask = this._searchDesktopOnClickMask || (() => {
      header.classList.remove('open');
      searchClear.style.display = 'none';
      searchLoading.style.display = 'none';
      this._searchDesktop && this._searchDesktop.autocomplete.setVal('');
    });

    this.clickMaskEventSet.add(this._searchDesktopOnClickMask);
  }


  initAutosearch(isMobile, searchLoading, searchClear, suffix) {
    const { maxResultLength = 10, snippetLength = 50, highlightTag = 'em', type, lunrIndexURL, lunrLanguageCode, noResultsFound } = this.config.search;

    const autosearch = autocomplete(`#search-input-${suffix}`, {
        hint: false,
        autoselect: true,
        dropdownMenuContainer: `#search-dropdown-${suffix}`,
        clearOnSelected: true,
        cssClasses: { noPrefix: true },
        debug: true,
    }, {
        name: 'search',
        source: (query, callback) => {
          toggleLoader(true);

          const finish = (results) => {
            toggleLoader(false);
            callback(results);
          };

          if (type === 'lunr') {
            this.handleLunrSearch.call(this, query, finish);
          } else if (type === 'algolia') {
            this.algoliaSearch(query, finish);
          }
        },
        templates: {
          suggestion: ({ title, date, context }) => `
            <div>
              <span class="suggestion-title">${title}</span>
              <span class="suggestion-date">${date}</span>
            </div>
            <div class="suggestion-context">${context}</div>`,
          empty: ({ query }) => `<div class="search-empty">${noResultsFound}: <span class="search-query">"${query}"</span></div>`,
          footer: () => this.getSearchFooter(type)
        }
    });

    autosearch.on('autocomplete:selected', (_event, suggestion) => {
      window.location.assign(suggestion.uri);
    });

    if (isMobile) {
      this._searchMobile = autosearch;
    } else {
      this._searchDesktop = autosearch;
    }

    function toggleLoader(loading) {
      searchLoading.style.display = loading ? 'inline' : 'none';
      searchClear.style.display = loading ? 'none' : 'inline';
    }
}

  handleLunrSearch(query, callback) {
    const { lunrIndexURL, lunrLanguageCode, snippetLength, maxResultLength, highlightTag } = this.config.search;

    const searchResults = () => {
        if (lunr.queryHandler) query = lunr.queryHandler(query);

        const results = {};
        this._index.search(query).forEach(({ ref, matchData: metadata }) => {
            const { uri, title, content } = this._indexData[ref];
            if (results[uri]) return;

            const context = this.createSnippet(content, metadata, snippetLength, highlightTag);
            results[uri] = { uri, title: this.highlightMatches(title, metadata, highlightTag), date: this._indexData[ref].date, context };
        });

        return Object.values(results).slice(0, maxResultLength);
    };

    if (!this._index) {
        fetch(lunrIndexURL)
            .then(response => response.json())
            .then((data) => {
                this._indexData = data.reduce((acc, record) => {
                    acc[record.objectID] = record;
                    return acc;
                }, {});

                this._index = lunr(function () {
                    if (lunrLanguageCode) this.use(lunr[lunrLanguageCode]);
                    this.ref('objectID');
                    this.field('title', { boost: 50 });
                    this.field('tags', { boost: 20 });
                    this.field('categories', { boost: 20 });
                    this.field('content', { boost: 10 });
                    this.metadataWhitelist = ['position'];
                    data.forEach(record => this.add(record));
                });

                callback(searchResults());
            })
            .catch((err) => {
                console.error(err);
                callback([]);
            });
    } else {
        callback(searchResults());
    }
}

  createSnippet(content, metadata, snippetLength, highlightTag) {
    let position = 0;

    Object.values(metadata).forEach(({ content: match }) => {
        if (match) {
            const matchPosition = match.position[0][0];
            position = position === 0 ? matchPosition : Math.min(position, matchPosition);
        }
    });

    position = Math.max(0, position - Math.floor(snippetLength / 5));
    const snippet = content.substr(position, snippetLength);
    return position > 0 ? `...${snippet}` : snippet;
  }

  highlightMatches(text, metadata, highlightTag) {
    Object.keys(metadata).forEach((key) => {
        const regex = new RegExp(`(${key})`, 'gi');
        text = text.replace(regex, `<${highlightTag}>$1</${highlightTag}>`);
    });
    return text;
  }

  getSearchFooter(type) {
    const { icon, href, searchType } = type === 'algolia'
        ? { icon: '<i class="fab fa-algolia fa-fw" aria-hidden="true"></i>', href: 'https://www.algolia.com/', searchType: 'Algolia' }
        : { icon: '', href: 'https://lunrjs.com/', searchType: 'Lunr.js' };

    return `<div class="search-footer">Search by <a href="${href}" rel="noopener noreferrer" target="_blank">${icon} ${searchType}</a></div>`;
  }

  algoliaSearch(query, callback) {
    this._algoliaIndex = this._algoliaIndex || algoliasearch(searchConfig.algoliaAppID, searchConfig.algoliaSearchKey).initIndex(searchConfig.algoliaIndex);

    this._algoliaIndex.search(query, {
      offset: 0,
      length: maxResultLength * 8,
      attributesToHighlight: ['title'],
      attributesToSnippet: ["content:".concat(snippetLength)],
      highlightPreTag: "<".concat(highlightTag, ">"),
      highlightPostTag: "</".concat(highlightTag, ">")
    }).then(function (_ref3) {
      var hits = _ref3.hits;
      var results = {};
      hits.forEach(function (_ref4) {
        var uri = _ref4.uri,
            date = _ref4.date,
            title = _ref4._highlightResult.title,
            content = _ref4._snippetResult.content;
        if (results[uri] && results[uri].context.length > content.value) return;
        results[uri] = {
          uri: uri,
          title: title.value,
          date: date,
          context: content.value
        };
      });
      finish(Object.values(results).slice(0, maxResultLength));
    }).catch(function (err) {
      console.error(err);
      finish([]);
    });
  }


  initDetails() {
    Array.from(document.getElementsByClassName('details')).forEach((details) => {
      const summary = details.getElementsByClassName('details-summary')[0];
      summary.addEventListener('click', () => {
        details.classList.toggle('open');
      }, false);
    });
  }
  
  initLightGallery() {
    if (this.config.lightgallery) {
      lightGallery(document.getElementById('content'), {
        plugins: [lgThumbnail, lgZoom],
        selector: '.lightgallery',
        speed: 400,
        hideBarsDelay: 2000,
        allowMediaOverlap: true,
        exThumbImage: 'data-thumbnail',
        toggleThumb: true,
        thumbWidth: 80,
        thumbHeight: '60px',
        actualSize: false,
        showZoomInOutIcons: true
      });
    }
  }
  
  initHighlight() {
    document.querySelectorAll('.highlight > pre.chroma').forEach((preChroma) => {
      const chroma = document.createElement('div');
      chroma.className = preChroma.className;
  
      const table = document.createElement('table');
      chroma.appendChild(table);
  
      const tbody = document.createElement('tbody');
      table.appendChild(tbody);
  
      const tr = document.createElement('tr');
      tbody.appendChild(tr);
  
      const td = document.createElement('td');
      tr.appendChild(td);
  
      preChroma.parentElement.replaceChild(chroma, preChroma);
      td.appendChild(preChroma);
    });
  
    document.querySelectorAll('.highlight > .chroma').forEach((chroma) => {
      const codeElements = chroma.querySelectorAll('pre.chroma > code');
      if (codeElements.length) {
        const code = codeElements[codeElements.length - 1];
        const header = document.createElement('div');
        header.className = `code-header ${code.className.toLowerCase()}`;
  
        const title = document.createElement('span');
        title.classList.add('code-title');
        title.insertAdjacentHTML('afterbegin', '<i class="arrow fas fa-chevron-right fa-fw" aria-hidden="true"></i>');
        title.addEventListener('click', () => {
          chroma.classList.toggle('open');
        }, false);
        header.appendChild(title);
  
        const ellipses = document.createElement('span');
        ellipses.insertAdjacentHTML('afterbegin', '<i class="fas fa-ellipsis-h fa-fw" aria-hidden="true"></i>');
        ellipses.classList.add('ellipses');
        ellipses.addEventListener('click', () => {
          chroma.classList.add('open');
        }, false);
        header.appendChild(ellipses);
  
        const copy = document.createElement('span');
        copy.insertAdjacentHTML('afterbegin', '<i class="far fa-copy fa-fw" aria-hidden="true"></i>');
        copy.classList.add('copy');
        const codeText = code.innerText;
  
        if (this.config.code.maxShownLines < 0 || codeText.split('\n').length < this.config.code.maxShownLines + 2) {
          chroma.classList.add('open');
        }
  
        if (this.config.code.copyTitle) {
          copy.setAttribute('data-clipboard-text', code);
          copy.title = this.config.code.copyTitle;
          const clipboard = new ClipboardJS(copy);
          clipboard.on('success', () => {
            this.util.animateCSS(code, 'animate__flash');
          });
          header.appendChild(copy);
        }
  
        chroma.insertBefore(header, chroma.firstChild);
      }
    });
  }
  
  initTable() {
    document.querySelectorAll('.content table').forEach((table) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentElement.replaceChild(wrapper, table);
      wrapper.appendChild(table);
    });
  }
  
  initHeaderLink() {
    for (let num = 1; num <= 6; num++) {
      document.querySelectorAll(`.single .content h${num}`).forEach((header) => {
        header.classList.add('headerLink');
        header.insertAdjacentHTML('afterbegin', `<a href="#${header.id}" class="header-mark"></a>`);
      });
    }
  }
  
  initToc() {
    const tocCore = document.getElementById('TableOfContents');
    if (tocCore === null) return;
  
    if (document.getElementById('toc-static').getAttribute('data-kept') || this.util.isTocStatic()) {
      const tocContentStatic = document.getElementById('toc-content-static');
      if (tocCore.parentElement !== tocContentStatic) {
        tocCore.parentElement.removeChild(tocCore);
        tocContentStatic.appendChild(tocCore);
      }
      if (this._tocOnScroll) this.scrollEventSet.delete(this._tocOnScroll);
    } else {
      const tocContentAuto = document.getElementById('toc-content-auto');
      if (tocCore.parentElement !== tocContentAuto) {
        tocCore.parentElement.removeChild(tocCore);
        tocContentAuto.appendChild(tocCore);
      }
  
      const toc = document.getElementById('toc-auto');
      const page = document.getElementsByClassName('page')[0];
      const rect = page.getBoundingClientRect();
      toc.style.left = `${rect.left + rect.width + 20}px`;
      toc.style.maxWidth = `${page.getBoundingClientRect().left - 20}px`;
      toc.style.visibility = 'visible';
  
      const tocLinkElements = tocCore.querySelectorAll('a:first-child');
      const tocLiElements = tocCore.getElementsByTagName('li');
      const headerLinkElements = document.getElementsByClassName('headerLink');
      const headerIsFixed = document.body.getAttribute('data-header-desktop') !== 'normal';
      const headerHeight = document.getElementById('header-desktop').offsetHeight;
      const TOP_SPACING = 20 + (headerIsFixed ? headerHeight : 0);
      const minTocTop = toc.offsetTop;
      const minScrollTop = minTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight);
  
      this._tocOnScroll = this._tocOnScroll || (() => {
        const footerTop = document.getElementById('post-footer').offsetTop;
        const maxTocTop = footerTop - toc.getBoundingClientRect().height;
        const maxScrollTop = maxTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight);
  
        if (this.newScrollTop < minScrollTop) {
          toc.style.position = 'absolute';
          toc.style.top = `${minTocTop}px`;
        } else if (this.newScrollTop > maxScrollTop) {
          toc.style.position = 'absolute';
          toc.style.top = `${maxTocTop}px`;
        } else {
          toc.style.position = 'fixed';
          toc.style.top = `${TOP_SPACING}px`;
        }
  
        tocLinkElements.forEach((tocLink) => tocLink.classList.remove('active'));
        tocLiElements.forEach((tocLi) => tocLi.classList.remove('has-active'));
  
        const INDEX_SPACING = 20 + (headerIsFixed ? headerHeight : 0);
        let activeTocIndex = headerLinkElements.length - 1;
  
        for (let i = 0; i < headerLinkElements.length - 1; i++) {
          const thisTop = headerLinkElements[i].getBoundingClientRect().top;
          const nextTop = headerLinkElements[i + 1].getBoundingClientRect().top;
  
          if (i === 0 && thisTop > INDEX_SPACING || thisTop <= INDEX_SPACING && nextTop > INDEX_SPACING) {
            activeTocIndex = i;
            break;
          }
        }
  
        if (activeTocIndex !== -1) {
          tocLinkElements[activeTocIndex].classList.add('active');
          let parent = tocLinkElements[activeTocIndex].parentElement;
          while (parent !== tocCore) {
            parent.classList.add('has-active');
            parent = parent.parentElement.parentElement;
          }
        }
      });
  
      this._tocOnScroll();
      this.scrollEventSet.add(this._tocOnScroll);
    }
  }
  
  initMath() {
    if (!this.config.math) {
        return;
    }

    this.config.math.trust = (context) => ['\\htmlId', '\\href'].includes(context.command);
    this.config.math.macros = {
        "\\cref": "\\href{##eqn-#1}{\\textnormal{Eq. (#2)}}",
        "\\pcref": "\\href{#3##eqn-#1}{\\textnormal{Eq. (#2) of this post}}",
        "\\label": "\\htmlId{eqn-#1}{}"
    };
    this.config.math.strict = "ignore";
    renderMathInElement(document.body, this.config.math);
}

  initMermaid() {
    const updateMermaidTheme = () => {
      const mermaidElements = document.getElementsByClassName('mermaid');
      if (!mermaidElements.length) return;

      mermaid.initialize({
          startOnLoad: false,
          theme: this.isDark ? 'dark' : 'neutral',
          securityLevel: 'loose'
      });

      Array.from(mermaidElements).forEach((mermaid) => {
          mermaid.render('svg-' + mermaid.id, this.data[mermaid.id], (svgCode) => {
              mermaid.innerHTML = svgCode;
          });
      });
    };

    this._mermaidOnSwitchTheme = this._mermaidOnSwitchTheme || updateMermaidTheme;
    this.switchThemeEventSet.add(this._mermaidOnSwitchTheme);
    updateMermaidTheme();
  }

  initEcharts() {
    if (!this.config.echarts) return;

    const { lightTheme, darkTheme } = this.config.echarts;

    echarts.registerTheme('light', lightTheme);
    echarts.registerTheme('dark', darkTheme);

    const updateEchartsTheme = () => {
        this._echartsArr = this._echartsArr || [];
        this._echartsArr.forEach(chart => chart.dispose());
        this._echartsArr = [];

        Array.from(document.getElementsByClassName('echarts')).forEach((echarts) => {
            const chart = echarts.init(echarts, this.isDark ? 'dark' : 'light', { renderer: 'svg' });
            chart.setOption(JSON.parse(this.data[echarts.id]));
            this._echartsArr.push(chart);
        });
    };

    this._echartsOnSwitchTheme = this._echartsOnSwitchTheme || updateEchartsTheme;
    this.switchThemeEventSet.add(this._echartsOnSwitchTheme);
    updateEchartsTheme();

    const resizeEcharts = () => this._echartsArr.forEach(chart => chart.resize());
    this._echartsOnResize = this._echartsOnResize || resizeEcharts;
    this.resizeEventSet.add(resizeEcharts);
  }

  initMapbox() {
    if (!this.config.mapbox) return;

    const { accessToken, RTLTextPlugin } = this.config.mapbox;
    mapboxgl.accessToken = accessToken;
    mapboxgl.setRTLTextPlugin(RTLTextPlugin);

    this._mapboxArr = [];

    Array.from(document.getElementsByClassName('mapbox')).forEach((mb_container) => {
      const {
          lng, lat, zoom, lightStyle, darkStyle, marked, navigation, geolocate, scale, fullscreen
      } = this.data[mapbox.id];

      const mapbox = new mapboxgl.Map({
          container: mb_container,
          center: [lng, lat],
          zoom: zoom,
          minZoom: 0.2,
          style: this.isDark ? darkStyle : lightStyle,
          attributionControl: false
      });

      if (marked) new mapboxgl.Marker().setLngLat([lng, lat]).addTo(mapbox);
      if (navigation) mapbox.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      if (geolocate) mapbox.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, showUserLocation: true, trackUserLocation: true }), 'bottom-right');
      if (scale) mapbox.addControl(new mapboxgl.ScaleControl());
      if (fullscreen) mapbox.addControl(new mapboxgl.FullscreenControl());
      mapbox.addControl(new MapboxLanguage());

      this._mapboxArr.push(mapbox);
    });

    const updateMapboxTheme = () => {
        this._mapboxArr.forEach(mapbox => {
            const mb_container = mapbox.getContainer();
            const { lightStyle, darkStyle } = this.data[mb_container.id];
            mapbox.setStyle(this.isDark ? darkStyle : lightStyle);
            mapbox.addControl(new MapboxLanguage());
        });
    };

    this._mapboxOnSwitchTheme = this._mapboxOnSwitchTheme || updateMapboxTheme;
    this.switchThemeEventSet.add(this._mapboxOnSwitchTheme);
  }

  initTypeit() {
    if (this.config.typeit) {
      const typeitConfig = this.config.typeit;
      const speed = typeitConfig.speed || 100;
      const cursorSpeed = typeitConfig.cursorSpeed || 1000;
      const cursorChar = typeitConfig.cursorChar || '|';
      const data = this.data;
      
      Object.values(typeitConfig.data).forEach((group) => {
        var typeone = function typeone(i) {
          var id = group[i];
          var instance = new TypeIt(`#${id}`, {
            strings: data[id],
            speed: speed,
            lifeLike: true,
            cursorSpeed: cursorSpeed,
            cursorChar: cursorChar,
            waitUntilVisible: true,
            afterComplete: () => {
              if (i === group.length - 1) {
                if (typeitConfig.duration >= 0) window.setTimeout(function () {
                  instance.destroy();
                }, typeitConfig.duration);
                return;
              }

              instance.destroy();
              typeone(i + 1);
            }
          }).go();
        };

        typeone(0);
      });

    }
  }

  initComment() {
    if (this.config.comment) {
      if (this.config.comment.gitalk) {
        this.config.comment.gitalk.body = decodeURI(window.location.href);
        const gitalk = new Gitalk(this.config.comment.gitalk);
        gitalk.render('gitalk');
      }

      if (this.config.comment.valine) {
        new Valine(this.config.comment.valine);
      }

      if (this.config.comment.utterances) {
        const utterancesConfig = this.config.comment.utterances;
        const script = document.createElement('script');
        script.src = 'https://utteranc.es/client.js';
        script.type = 'text/javascript';
        script.setAttribute('repo', utterancesConfig.repo);
        script.setAttribute('issue-term', utterancesConfig.issueTerm);
        if (utterancesConfig.label) script.setAttribute('label', utterancesConfig.label);
        script.setAttribute('theme', this.isDark ? utterancesConfig.darkTheme : utterancesConfig.lightTheme);
        script.crossOrigin = 'anonymous';
        script.async = true;
        document.getElementById('utterances').appendChild(script);

        this._utterancesOnSwitchTheme = this._utterancesOnSwitchTheme || (() => {
          const message = {
            type: 'set-theme',
            theme: this.isDark ? utterancesConfig.darkTheme : utterancesConfig.lightTheme,
          };
          const iframe = document.querySelector('.utterances-frame');
          iframe.contentWindow.postMessage(message, 'https://utteranc.es');
        });

        this.switchThemeEventSet.add(this._utterancesOnSwitchTheme);
      }

      if (this.config.comment.giscus) {
        const giscusConfig = this.config.comment.giscus;
        const giscusScript = document.createElement('script');
        giscusScript.src = 'https://giscus.app/client.js';
        giscusScript.type = 'text/javascript';
        giscusScript.setAttribute('data-repo', giscusConfig.repo);
        giscusScript.setAttribute('data-repo-id', giscusConfig.repoId);
        giscusScript.setAttribute('data-category', giscusConfig.category);
        giscusScript.setAttribute('data-category-id', giscusConfig.categoryId);
        giscusScript.setAttribute('data-lang', giscusConfig.lang);
        giscusScript.setAttribute('data-mapping', giscusConfig.mapping);
        giscusScript.setAttribute('data-reactions-enabled', giscusConfig.reactionsEnabled);
        giscusScript.setAttribute('data-emit-metadata', giscusConfig.emitMetadata);
        giscusScript.setAttribute('data-input-position', giscusConfig.inputPosition);
        if (giscusConfig.lazyLoading) giscusScript.setAttribute('data-loading', 'lazy');
        giscusScript.setAttribute('data-theme', this.isDark ? giscusConfig.darkTheme : giscusConfig.lightTheme);
        giscusScript.crossOrigin = 'anonymous';
        giscusScript.async = true;
        document.getElementById('giscus').appendChild(giscusScript);

        this._giscusOnSwitchTheme = this._giscusOnSwitchTheme || (() => {
          const message = {
            setConfig: {
              theme: this.isDark ? giscusConfig.darkTheme : giscusConfig.lightTheme,
              reactionsEnabled: false,
            },
          };
          const iframe = document.querySelector('iframe.giscus-frame');
          if (iframe) {
            iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
          }
        });

        this.switchThemeEventSet.add(this._giscusOnSwitchTheme);
      }
    }
  }

  initCookieconsent() {
    if (this.config.cookieconsent) {
      cookieconsent.initialise(this.config.cookieconsent);
    }
  }

  onScroll() {
    const headers = [];
    if (document.body.getAttribute('data-header-desktop') === 'auto') {
      headers.push(document.getElementById('header-desktop'));
    }
    if (document.body.getAttribute('data-header-mobile') === 'auto') {
      headers.push(document.getElementById('header-mobile'));
    }

    const fixedButtons = document.getElementById('fixed-buttons');
    const ACCURACY = 20;
    const MINIMUM = 100;

    window.addEventListener('scroll', () => {
      this.newScrollTop = this.util.getScrollTop();
      const scroll = this.newScrollTop - this.oldScrollTop;

      const isMobile = this.util.isMobile();

      headers.forEach((header) => {
        if (scroll > ACCURACY) {
          header.classList.remove('animate__fadeInDown');
          this.util.animateCSS(header, ['animate__fadeOutUp', 'animate__faster'], true);
        } else if (scroll < -ACCURACY) {
          header.classList.remove('animate__fadeOutUp');
          this.util.animateCSS(header, ['animate__fadeInDown', 'animate__faster'], true);
        }
      });

      if (this.newScrollTop > MINIMUM) {
        if (isMobile && scroll > ACCURACY) {
          fixedButtons.classList.remove('animate__fadeIn');
          this.util.animateCSS(fixedButtons, ['animate__fadeOut', 'animate__faster'], true);
        } else if (!isMobile || scroll < -ACCURACY) {
          fixedButtons.style.display = 'block';
          fixedButtons.classList.remove('animate__fadeOut');
          this.util.animateCSS(fixedButtons, ['animate__fadeIn', 'animate__faster'], true);
        }
      } else {
        if (!isMobile) {
          fixedButtons.classList.remove('animate__fadeIn');
          this.util.animateCSS(fixedButtons, ['animate__fadeOut', 'animate__faster'], true);
        }
        fixedButtons.style.display = 'none';
      }

      this.scrollEventSet.forEach((event) => event());
      this.oldScrollTop = this.newScrollTop;
    });
  }

  onResize() {
    window.addEventListener('resize', () => {
      if (!this._resizeTimeout) {
        this._resizeTimeout = setTimeout(() => {
          this._resizeTimeout = null;
          this.resizeEventSet.forEach((event) => event());
          this.initToc();
          this.initMermaid();
          this.initSearch();
        }, 100);
      }
    });
  }

  onClickMask() {
    document.getElementById('mask').addEventListener('click', () => {
      this.clickMaskEventSet.forEach((event) => event());
      document.body.classList.remove('blur');
    });
  }

  init() {
    // console.log("Nothing loaded yet");
    // Something can go wrong in initRaw() when server rendering! However, needs to be loaded before math. Best solution is to just escape characters like * _ >> by hand.
    // UPDATE it seems it does work when the shortcode is directly connected/on the same line with the equation.
    this.initRaw();

    // All priority and async libraries
    this.initMermaid();
    this.initSearch();
    this.initMath();
    try{
      this.initCookieconsent();
    } catch (err) {console.error(err);}

    // all pure javascript (or using hugo build-ins) function calls
    this.initDetails();
    this.initSVGIcon();
    this.initMenuMobile();
    this.initHeaderLink();
    this.initHighlight();
    this.initSwitchTheme();
    this.initTable();

    // all defered libaries
    this.initLightGallery();
    this.initTypeit();

    // all not specified or used yet
    this.initTwemoji();
    this.initEcharts();
    this.initMapbox();

    window.setTimeout(function () {
      this.initToc();
      this.initComment();
      this.onScroll();
      this.onResize();
      this.onClickMask();
    }.bind(this), 200);
  }
}


const theme = new Theme();
