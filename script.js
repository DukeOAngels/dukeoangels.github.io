document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================================
    // GLOBAL GITHUB STORAGE TARGET ROUTER
    // ==========================================================================
    const GH_CONFIG = {
        username: "DukeOAngels",
        repo: "dukeoangels.github.io", // Change to another repo if you store media files elsewhere!
        branch: "main"
    };

    // Helper to generate proper raw content delivery URLs
    const getRawUrl = (path) => `https://raw.githubusercontent.com/${GH_CONFIG.username}/${GH_CONFIG.repo}/${GH_CONFIG.branch}/${path}`;
    const getApiUrl = (path) => `https://api.github.com/repos/${GH_CONFIG.username}/${GH_CONFIG.repo}/contents/${path}?ref=${GH_CONFIG.branch}`;

    // ==========================================================================
    // ACCESS PANEL INTERFACE MANAGEMENT
    // ==========================================================================
    const menuToggle = document.getElementById("menu-toggle");
    const sidePanel = document.getElementById("side-panel");
    const navItems = document.querySelectorAll(".nav-item");
    const viewSections = document.querySelectorAll(".view-section");

    function closePanel() {
        menuToggle.classList.remove("active");
        sidePanel.classList.remove("open");
        setTimeout(() => {
            sidePanel.classList.remove("active");
        }, 400);
    }

    menuToggle.addEventListener("click", (e) => {
        e.stopPropagation(); 
        menuToggle.classList.toggle("active");

        if (!sidePanel.classList.contains("active")) {
            sidePanel.classList.add("active");
            setTimeout(() => {
                sidePanel.classList.add("open");
            }, 50); 
        } else {
            closePanel();
        }
    });

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetID = item.getAttribute("data-target");
            
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            viewSections.forEach(section => {
                section.classList.remove("active");
                if (section.id === targetID) {
                    section.classList.add("active");
                }
            });

            closePanel();
        });
    });

    // ==========================================================================
    // AUTOMATED DYNAMIC MEDIA FETCH ENGINE
    // ==========================================================================
    
    let currentWorkIndex = 0;
    let totalProjects = 0;

    async function loadAutomatedMedia() {
        // --- 1. POPULATE DAVINCI VIDEOS ---
        const davinciGrid = document.getElementById("davinci-dynamic-grid");
        try {
            const res = await fetch(getApiUrl("davinci"));
            if (!res.ok) throw new Error("Could not fetch davinci folder contents");
            const files = await res.json();
            
            const videoExtensions = [".mp4", ".webm", ".mov"];
            const videos = files.filter(f => videoExtensions.some(ext => f.name.toLowerCase().endswith(ext)));
            
            if (videos.length === 0) {
                davinciGrid.innerHTML = `<p class="console-line" style="color: rgba(255,255,255,0.3)">// No video files found in the 'davinci' directory.</p>`;
            } else {
                davinciGrid.innerHTML = "";
                videos.forEach(vid => {
                    const cleanTitle = vid.name.split('.')[0].replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    const videoUrl = getRawUrl(vid.path);
                    
                    const card = `
                        <div class="video-card">
                            <video autoplay muted loop playsinline src="${videoUrl}"></video>
                            <div class="video-meta">${cleanTitle}</div>
                        </div>
                    `;
                    davinciGrid.insertAdjacentHTML("beforeend", card);
                });
            }
        } catch (err) {
            console.error(err);
            davinciGrid.innerHTML = `<p class="console-line status-yellow">> TARGET LOCATION 'davinci/' INACCESSIBLE</p>`;
        }

        // --- 2. POPULATE RENDERS SLIDER SYSTEM ---
        const workspace = document.getElementById("render-workspace-container");
        try {
            const res = await fetch(getApiUrl("render"));
            if (!res.ok) throw new Error("Could not fetch render folder contents");
            const files = await res.json();
            
            // Check how many complete A/B pairs exist sequentially starting from 0
            while (
                files.some(f => f.name.toLowerCase() === `${totalProjects}a.png`) &&
                files.some(f => f.name.toLowerCase() === `${totalProjects}b.png`)
            ) {
                totalProjects++;
            }

            const loader = workspace.querySelector(".slider-loader");
            if (loader) loader.remove();

            if (totalProjects === 0) {
                workspace.insertAdjacentHTML("afterbegin", `<p class="console-line" style="padding:40px; color:rgba(255,255,255,0.3)">// Drop paired files (0a.png, 0b.png) into your repository's render/ folder</p>`);
            } else {
                // Reveal slider UI controls
                document.getElementById("slider-handle").style.display = "block";
                document.getElementById("prev-work").style.display = "flex";
                document.getElementById("next-work").style.display = "flex";
                document.getElementById("gallery-counter").style.display = "block";

                // Inject the layer panes
                const panesHTML = `
                    <div class="image-pane layer-render-pass">
                        <img id="render-img-b" src="${getRawUrl(`render/0b.png`)}" alt="Finished Render View">
                    </div>
                    <div class="image-pane layer-wireframe">
                        <img id="render-img-a" src="${getRawUrl(`render/0a.png`)}" alt="Wireframe / Work View">
                    </div>
                `;
                workspace.insertAdjacentHTML("afterbegin", panesHTML);
                
                const imgA = document.getElementById("render-img-a");
                const imgB = document.getElementById("render-img-b");
                const counterDisplay = document.getElementById("gallery-counter");
                
                counterDisplay.textContent = `PROJECT // 01`;

                // Handle updates
                function updateGalleryImages() {
                    imgA.src = getRawUrl(`render/${currentWorkIndex}a.png`);
                    imgB.src = getRawUrl(`render/${currentWorkIndex}b.png`);
                    counterDisplay.textContent = `PROJECT // 0${currentWorkIndex + 1}`;
                }

                document.getElementById("prev-work").addEventListener("click", (e) => {
                    e.stopPropagation();
                    currentWorkIndex = (currentWorkIndex - 1 + totalProjects) % totalProjects;
                    updateGalleryImages();
                });

                document.getElementById("next-work").addEventListener("click", (e) => {
                    e.stopPropagation();
                    currentWorkIndex = (currentWorkIndex + 1) % totalProjects;
                    updateGalleryImages();
                });
            }
        } catch (err) {
            console.error(err);
            workspace.innerHTML = `<p class="console-line status-yellow" style="padding:40px">> TARGET LOCATION 'render/' INACCESSIBLE</p>`;
        }
    }

    // Slider Split Line Position Mathematics
    const workspaceContainer = document.getElementById("render-workspace-container");
    const sliderHandle = document.getElementById("slider-handle");

    function moveSplitSlider(xPosition) {
        const wireframePane = document.querySelector(".layer-wireframe");
        if (!wireframePane || !sliderHandle) return;

        const bounds = workspaceContainer.getBoundingClientRect();
        let relativeX = xPosition - bounds.left;
        
        if (relativeX < 0) relativeX = 0;
        if (relativeX > bounds.width) relativeX = bounds.width;
        
        const splitPercentage = (relativeX / bounds.width) * 100;
        
        wireframePane.style.width = `${splitPercentage}%`;
        sliderHandle.style.left = `${splitPercentage}%`;
    }

    window.addEventListener("mousemove", (e) => {
        if (!document.getElementById("viewport-render").classList.contains("active")) return;
        moveSplitSlider(e.clientX);
    });

    window.addEventListener("touchmove", (e) => {
        if (!document.getElementById("viewport-render").classList.contains("active")) return;
        if (e.touches.length > 0) {
            moveSplitSlider(e.touches[0].clientX);
        }
    });

    // ==========================================================================
    // DYNAMIC GITHUB REPOSITORY LIVE FETCHER (TAB 4)
    // ==========================================================================
    const githubGrid = document.getElementById("github-dynamic-grid");

    async function fetchGitHubRepos() {
        try {
            const response = await fetch(`https://api.github.com/users/${GH_CONFIG.username}/repos?sort=updated`);
            if (!response.ok) throw new Error("API response error status");
            
            const repos = await response.json();
            githubGrid.innerHTML = "";

            if(repos.length === 0) {
                githubGrid.innerHTML = `<p class="console-line" style="color: rgba(255,255,255,0.4)">// No public repositories found on this account.</p>`;
                return;
            }

            repos.forEach(repo => {
                if (repo.name.toLowerCase() === GH_CONFIG.username.toLowerCase()) return;
                const description = repo.description ? repo.description : "No description provided yet.";
                
                const cardHTML = `
                    <a href="${repo.html_url}" target="_blank" class="repo-card">
                        <div class="repo-header">
                            <i class="bi bi-folder-symlink"></i>
                            <span class="repo-status">
                                <i class="bi bi-star-fill" style="font-size: 0.7rem; color: #e6b800; margin-right: 3px;"></i> ${repo.stargazers_count}
                            </span>
                        </div>
                        <h3>${repo.name}</h3>
                        <p>${description}</p>
                        <div class="repo-tags">
                            ${repo.language ? `<span>${repo.language}</span>` : `<span>Code</span>`}
                        </div>
                    </a>
                `;
                githubGrid.insertAdjacentHTML("beforeend", cardHTML);
            });

        } catch (error) {
            console.error("GitHub API Failure:", error);
            githubGrid.innerHTML = `
                <div class="terminal-loader">
                    <p class="console-line status-yellow">> CONNECTION LOST TO GIT ENDPOINT</p>
                    <p class="console-line sub-text">// Failed to resolve live profile data stream seamlessly.</p>
                </div>
            `;
        }
    }

    // Trigger complete asset loader sequence
    loadAutomatedMedia();
    fetchGitHubRepos();
});