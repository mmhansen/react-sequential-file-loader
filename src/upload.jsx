const React = require('react')
const Dropzone = require('react-dropzone')
const axios = require('axios')


/*
 * UI Element
 */
function DropzoneInputUI (handleDrop, files) {
  return function (props) {
    const style = {
      padding: '1em'
    }
    const DropzoneText = props.DropzoneText || <p style={style}>Try dropping some files here.</p>
    return (
      <div>
        <Dropzone onDrop={(files, e) => { handleDrop(files) }}>
          <DropzoneText />
        </Dropzone>
        {files && Array.isArray(files) && (
          <ul>
            { files.map((file, i) => <li key={i}>{file.name}</li>) }
          </ul>
        )}
      </div>
    );
  }
}

/*
 * HOC to manage file upload
 */
const initial = {
  previousLoaded: 0,
  upload: {
    progress: 0,
    total: 0
  },
  fileUpload: {
    progress: 0,
    total: 0
  },
  status: {
    done: false,
    progress: false,
    error: false
  },
  files: []
}

function Uploader (ComposedComponent) {
  class ImageSender extends Component {
    constructor (props) {
      super(props)
      this.uploadFiles = this.uploadFiles.bind(this)
      this.resetUpload = this.resetUpload.bind(this)
      this.state = initial
    }
    uploadFiles (url) {
      // send one image, wait for response and then call again
      // when no more images, exit and set state flag
      const files = this.state.files

      const imageRequests = (files) => {
        // console.log(images)
        // base case to exit
        if (files.length === 0) {
          this.setState({
            status: {
              done: true,
              progress: this.state.progress,
              error: this.state.error
            }
          })
          return
        }
        // send request
        /* eslint-disable no-undef */
        const formData = new FormData()
        /* eslint-enable no-undef */
        formData.append('files', files[0])
        const config = {
          headers: { 'content-type': 'multipart/form-data' },
          onUploadProgress: ({ total, loaded }) => {
            this.setState({
              upload: {
                progress: this.state.upload.progress + loaded - this.state.previousLoaded,
                total: this.state.upload.total
              },
              previousLoaded: (total === loaded) ? 0 : loaded
            })
            return
          }
        }

        axios.post(url, formData, config)
          .then(res => {
            this.setState({
              fileUpload: {
                progress: this.state.fileUpload.progress + 1,
                total: this.state.fileUpload.total
              }
            })
            // go deeper!!!!
            if (!this.state.status.progress) {
              imageRequests(files.slice(1))
            }
          })
          .catch(res => {
            console.log(res)
            this.setState({
              status: {
                error: 'Image failed to upload. Press reset and try again.'
              }
            })
            return
          })
      }

      // start the loading bar

      this.setState({
        upload: {
          progress: 0,
          total: files.reduce((acc, file) => acc + file.size, 0)
        },
        fileUpload: {
          progress: 0,
          total: files.length
        },
        status: {
          done: false,
          progress: true,
          error: false
        }
      })
      // start the request queue
      imageRequests(files)
    }
    resetUpload () {
      this.setState(initial)
    }
    handleDrop (files) {
      this.setState({
         files: files
       })
    }
    render () {
      const DropzoneInput = DropzoneInputUI(this.handleDrop, this.state.files)
      return (
        <ComposedComponent
          status={this.state.status}
          upload={this.state.upload}
          fileUpload={this.state.fileUpload}
          uploadFiles={this.uploadFiles}
          resetUpload={this.resetUpload}
          DropzoneInput={DropzoneInput}
        />
      )
    }
  }
  return ImageSender
}

module.exports = Uploader
