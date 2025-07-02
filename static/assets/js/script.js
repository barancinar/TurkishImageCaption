// DOM Elements
const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const imageName = document.getElementById("imageName");
const removeImageBtn = document.getElementById("removeImage");
const generateBtn = document.getElementById("generateBtn");
const captionForm = document.getElementById("captionForm");
const resultSection = document.getElementById("resultSection");
const resultContent = document.getElementById("resultContent");
const copyBtn = document.getElementById("copyBtn");
const minLengthInput = document.getElementById("min_length");
const repetitionPenaltyInput = document.getElementById("repetition_penalty");
const lengthValue = document.getElementById("lengthValue");
const penaltyValue = document.getElementById("penaltyValue");

// Global Variables
let currentFile = null;
let isProcessing = false;

// Initialize Event Listeners
document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
    updateRangeValues();
    animateOnScroll();
});

// Event Listeners
function initializeEventListeners() {
    // File input change
    imageInput.addEventListener("change", handleFileSelect);

    // Drag and drop functionality
    uploadArea.addEventListener("dragover", handleDragOver);
    uploadArea.addEventListener("dragleave", handleDragLeave);
    uploadArea.addEventListener("drop", handleFileDrop);
    uploadArea.addEventListener("click", () => imageInput.click());

    // Remove image button
    removeImageBtn.addEventListener("click", removeImage);

    // Form submission
    captionForm.addEventListener("submit", handleFormSubmit);

    // Range inputs
    minLengthInput.addEventListener("input", updateRangeValues);
    repetitionPenaltyInput.addEventListener("input", updateRangeValues);

    // Copy button
    copyBtn.addEventListener("click", copyToClipboard);

    // Smooth scrolling for navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", handleNavClick);
    });

    // Navbar scroll effect
    window.addEventListener("scroll", handleNavbarScroll);
}

// File Handling Functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processSelectedFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add("dragover");
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove("dragover");
}

function handleFileDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove("dragover");

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (isValidImageFile(file)) {
            processSelectedFile(file);
        } else {
            showNotification(
                "Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, JPEG)",
                "error"
            );
        }
    }
}

function processSelectedFile(file) {
    if (!isValidImageFile(file)) {
        showNotification(
            "Geçersiz dosya formatı. Lütfen PNG, JPG veya JPEG dosyası seçin.",
            "error"
        );
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        showNotification(
            "Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.",
            "error"
        );
        return;
    }

    currentFile = file;
    displayImagePreview(file);
    generateBtn.disabled = false;

    // Add pulse animation to generate button
    generateBtn.classList.add("pulse");
    setTimeout(() => generateBtn.classList.remove("pulse"), 2000);

    // HATAYI ENGELLEMEK İÇİN:
    imageInput.required = false;
}

function isValidImageFile(file) {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    return validTypes.includes(file.type);
}

function displayImagePreview(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        previewImg.src = e.target.result;
        imageName.textContent = file.name;

        // Show preview with animation
        imagePreview.style.display = "block";
        imagePreview.style.opacity = "0";
        imagePreview.style.transform = "translateY(20px)";

        setTimeout(() => {
            imagePreview.style.transition = "all 0.5s ease-out";
            imagePreview.style.opacity = "1";
            imagePreview.style.transform = "translateY(0)";
        }, 100);

        // Hide upload area
        uploadArea.style.display = "none";
    };

    reader.readAsDataURL(file);
}

function removeImage() {
    currentFile = null;
    imagePreview.style.display = "none";
    uploadArea.style.display = "block";
    generateBtn.disabled = true;
    generateBtn.classList.remove("pulse");

    // Reset file input
    imageInput.value = "";
    imageInput.required = true;

    // Hide result section
    resultSection.style.display = "none";

    showNotification("Görsel kaldırıldı", "info");
}

// Form Submission
async function handleFormSubmit(event) {
    event.preventDefault();

    if (isProcessing || !currentFile) {
        return;
    }

    isProcessing = true;
    showLoadingState();

    try {
        const formData = new FormData();
        // input dosyasını değil, currentFile'ı ekle
        formData.append("image", currentFile);
        formData.append("min_length", minLengthInput.value);
        formData.append("repetition_penalty", repetitionPenaltyInput.value);

        const response = await fetch("/generate_caption", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        displayResult(data.caption);
        showNotification("Açıklama başarıyla oluşturuldu!", "success");
    } catch (error) {
        console.error("Error:", error);
        displayError(error.message);
        showNotification("Bir hata oluştu: " + error.message, "error");
    } finally {
        isProcessing = false;
        hideLoadingState();
    }
}

function showLoadingState() {
    generateBtn.classList.add("loading");
    generateBtn.disabled = true;

    // Show result section with loading animation
    resultSection.style.display = "block";
    resultContent.innerHTML = `
        <div class="loading-animation">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>
    `;

    // Scroll to result section
    resultSection.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideLoadingState() {
    generateBtn.classList.remove("loading");
    generateBtn.disabled = false;
}

function displayResult(caption) {
    resultContent.innerHTML = `
        <div class="result-text">${caption}</div>
    `;
    copyBtn.style.display = "flex";
    copyBtn.dataset.caption = caption;
}

function displayError(errorMessage) {
    resultContent.innerHTML = `
        <div class="result-placeholder">
            <i class="fas fa-exclamation-triangle" style="color: var(--error);"></i>
            <p style="color: var(--error);">Hata: ${errorMessage}</p>
        </div>
    `;
    copyBtn.style.display = "none";
}

// Range Input Updates
function updateRangeValues() {
    lengthValue.textContent = minLengthInput.value;
    penaltyValue.textContent = repetitionPenaltyInput.value;
}

// Copy to Clipboard
async function copyToClipboard() {
    const caption = copyBtn.dataset.caption;

    try {
        await navigator.clipboard.writeText(caption);

        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
        copyBtn.style.background = "var(--success)";

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = "var(--primary-color)";
        }, 2000);

        showNotification("Açıklama panoya kopyalandı!", "success");
    } catch (error) {
        console.error("Copy failed:", error);
        showNotification("Kopyalama başarısız oldu", "error");
    }
}

// Navigation
function handleNavClick(event) {
    event.preventDefault();

    // Remove active class from all links
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active");
    });

    // Add active class to clicked link
    event.target.classList.add("active");

    const targetId = event.target.getAttribute("href");
    if (targetId === "#home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function handleNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    const scrollY = window.scrollY;

    if (scrollY > 100) {
        navbar.style.background = "rgba(255, 255, 255, 0.98)";
        navbar.style.boxShadow = "0 2px 20px rgba(0,0,0,0.1)";
    } else {
        navbar.style.background = "rgba(255, 255, 255, 0.95)";
        navbar.style.boxShadow = "none";
    }
}

// Notifications
function showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notification) => notification.remove());

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation =
                "slideOutRight 0.3s ease-out forwards";
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case "success":
            return "check-circle";
        case "error":
            return "exclamation-circle";
        case "warning":
            return "exclamation-triangle";
        default:
            return "info-circle";
    }
}

function getNotificationColor(type) {
    switch (type) {
        case "success":
            return "#48bb78";
        case "error":
            return "#f56565";
        case "warning":
            return "#ed8936";
        default:
            return "#4299e1";
    }
}

// Animation on Scroll
function animateOnScroll() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px",
        }
    );

    // Observe elements for animation
    document
        .querySelectorAll(".upload-section, .result-section")
        .forEach((el) => {
            el.style.opacity = "0";
            el.style.transform = "translateY(30px)";
            el.style.transition = "all 0.6s ease-out";
            observer.observe(el);
        });
}

// Keyboard Shortcuts
document.addEventListener("keydown", function (event) {
    // Ctrl/Cmd + V to paste image from clipboard
    if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        handleClipboardPaste(event);
    }

    // Enter to generate caption (when image is selected)
    if (event.key === "Enter" && currentFile && !isProcessing) {
        event.preventDefault();
        captionForm.dispatchEvent(new Event("submit"));
    }

    // Escape to remove image
    if (event.key === "Escape" && currentFile) {
        removeImage();
    }
});

async function handleClipboardPaste(event) {
    try {
        const clipboardItems = await navigator.clipboard.read();

        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith("image/")) {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], "pasted-image.png", {
                        type: blob.type,
                    });
                    processSelectedFile(file);
                    showNotification("Görsel panodan yapıştırıldı!", "success");
                    break;
                }
            }
        }
    } catch (error) {
        console.log("Clipboard paste not supported or no image in clipboard");
    }
}

// Add CSS animations for notifications
const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(notificationStyles);
