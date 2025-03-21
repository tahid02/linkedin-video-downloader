document.addEventListener("DOMContentLoaded", () => {
  const linkedinUrlInput = document.getElementById("linkedin-url");
  const fetchBtn = document.getElementById("fetch-btn");
  const resultContainer = document.getElementById("result-container");
  const videoPreview = document.getElementById("video-preview");
  const downloadBtn = document.getElementById("download-btn");
  const loadingElement = document.getElementById("loading");
  const errorContainer = document.getElementById("error-container");
  const errorMessage = document.getElementById("error-message");

  // Add event listener to the fetch button
  fetchBtn.addEventListener("click", async () => {
    const linkedinUrl = linkedinUrlInput.value.trim();

    // Validate URL
    if (!linkedinUrl) {
      showError("Please enter a LinkedIn post URL");
      return;
    }

    if (!linkedinUrl.includes("linkedin.com")) {
      showError("Please enter a valid LinkedIn URL");
      return;
    }

    // Clear previous results and show loading
    hideError();
    resultContainer.classList.add("hidden");
    loadingElement.classList.remove("hidden");

    try {
      // Use Zenscrape API to fetch LinkedIn content
      const zenscrapeApiKey = "538956b0-03f9-11f0-9a86-458355eb20b1";
      const zenscrapeUrl = `https://app.zenscrape.com/api/v1/get?apikey=${zenscrapeApiKey}&url=${encodeURIComponent(linkedinUrl)}`;

      // Fetch the LinkedIn post data
      const response = await fetch(zenscrapeUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch the LinkedIn post");
      }

      const htmlContent = await response.text();

      // Extract video URL from the HTML content
      const videoUrl = extractVideoUrl(htmlContent);

      if (!videoUrl) {
        throw new Error("Could not find a video in this LinkedIn post");
      }

      // Set the video source
      videoPreview.src = videoUrl;
      
      // Pre-fetch the video content
      let videoBlob = null;
      let blobUrl = null;
      
      // Start fetching the video in the background
      fetch(videoUrl)
        .then(response => {
          if (!response.ok) throw new Error("Failed to pre-fetch video");
          return response.blob();
        })
        .then(blob => {
          videoBlob = blob;
          blobUrl = URL.createObjectURL(blob);
          console.log("Video pre-fetched successfully");
        })
        .catch(error => {
          console.error("Error pre-fetching video:", error);
          // If pre-fetch fails, we'll fall back to regular download
        });
      
      // Set up download button to use pre-fetched content if available
      downloadBtn.onclick = () => {
        if (videoBlob && blobUrl) {
          // If pre-fetched content is available, use it immediately
          triggerDownload(blobUrl);
        } else {
          // Fall back to regular download if pre-fetch failed or isn't complete
          downloadVideo(videoUrl);
        }
      };

      loadingElement.classList.add("hidden");
      resultContainer.classList.remove("hidden");
    } catch (error) {
      loadingElement.classList.add("hidden");
      showError(error.message);
    }
  });

  // Function to trigger download using a blob URL
  function triggerDownload(blobUrl) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "linkedin-video.mp4";
    a.style.display = "none";

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      // Note: We don't revoke the blob URL here since it might be reused
    }, 100);
  }

  // Function to download the video (fallback method)
  function downloadVideo(videoUrl) {
    // Show loading indicator while downloading
    loadingElement.classList.remove("hidden");

    // Fetch the video as a blob
    fetch(videoUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to download video");
        return response.blob();
      })
      .then((blob) => {
        // Create a blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // Trigger the download
        triggerDownload(blobUrl);
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          loadingElement.classList.add("hidden");
        }, 100);
      })
      .catch((error) => {
        loadingElement.classList.add("hidden");
        showError("Failed to download video: " + error.message);
      });
  }

  // Function to extract video URL from HTML content
  function extractVideoUrl(htmlContent) {
    console.log("Starting video URL extraction...");
    console.log(htmlContent);
    // Step 1: Parse the HTML and get all code tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    console.log("parsed html", doc);
    const videoElement = doc.querySelector(".share-native-video video");

    const dataSources = JSON.parse(videoElement.getAttribute("data-sources"));

    console.log("data sources", dataSources);
    const videoUrl = dataSources[0].src;
    if (!videoUrl) {
      console.log("No video URL found in any code tag");
    }

    return videoUrl;
  }

  // Function to show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove("hidden");
  }

  // Function to hide error message
  function hideError() {
    errorContainer.classList.add("hidden");
  }
});
