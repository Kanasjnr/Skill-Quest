import { toPng } from 'html-to-image'

// Generate certificate image
export const generateCertificateImage = async (certificate) => {
  try {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL
    const verificationUrl = `${baseUrl}/verify/${certificate.id}`

    // Create certificate HTML
    const certificateHTML = `
      <div style="
        width: 800px;
        height: 600px;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 20px solid #4f46e5;
        border-radius: 10px;
        padding: 40px;
        font-family: 'Arial', sans-serif;
        position: relative;
        overflow: hidden;
      ">
        <!-- Background Pattern -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiM0ZjQ2ZTUiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+');
          opacity: 0.1;
        "></div>

        <!-- Header -->
        <div style="
          text-align: center;
          margin-bottom: 40px;
        ">
          <h1 style="
            color: #4f46e5;
            font-size: 36px;
            margin: 0;
            font-weight: bold;
          ">Certificate of Completion</h1>
          <p style="
            color: #6b7280;
            font-size: 18px;
            margin: 10px 0 0;
          ">This is to certify that</p>
        </div>

        <!-- Recipient -->
        <div style="
          text-align: center;
          margin: 20px 0;
        ">
          <h2 style="
            color: #1f2937;
            font-size: 28px;
            margin: 0;
            font-weight: bold;
          ">${certificate.recipient}</h2>
        </div>

        <!-- Course -->
        <div style="
          text-align: center;
          margin: 20px 0;
        ">
          <p style="
            color: #4b5563;
            font-size: 20px;
            margin: 0;
          ">has successfully completed the course</p>
          <h3 style="
            color: #4f46e5;
            font-size: 24px;
            margin: 10px 0;
            font-weight: bold;
          ">${certificate.courseTitle}</h3>
        </div>

        <!-- Date -->
        <div style="
          text-align: center;
          margin: 20px 0;
        ">
          <p style="
            color: #6b7280;
            font-size: 16px;
            margin: 0;
          ">Issued on ${certificate.issueDate}</p>
        </div>

        <!-- Certificate ID -->
        <div style="
          position: absolute;
          bottom: 20px;
          left: 40px;
          color: #9ca3af;
          font-size: 14px;
        ">
          Certificate ID: ${certificate.id}
        </div>

        <!-- Verification URL -->
        <div style="
          position: absolute;
          bottom: 20px;
          right: 40px;
          color: #9ca3af;
          font-size: 12px;
          text-align: right;
          max-width: 200px;
        ">
          Verify at:<br/>
          ${verificationUrl}
        </div>
      </div>
    `

    // Create a temporary container
    const container = document.createElement('div')
    container.innerHTML = certificateHTML
    document.body.appendChild(container)

    // Generate image
    const image = await toPng(container.firstElementChild, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    })

    // Clean up
    document.body.removeChild(container)

    // Upload to Cloudinary
    const formData = new FormData()
    formData.append('file', dataURLtoFile(image, `certificate-${certificate.id}.png`))
    formData.append('upload_preset', 'skillquest')
    formData.append('folder', 'certificates')

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload certificate to Cloudinary')
    }

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error('Error generating certificate image:', error)
    throw error
  }
}

// Helper function to convert data URL to File object
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
} 