var bsurl = require('../../utils/async.js')
var app = getApp()
Page({
  data: {
    art: {},
    loading: false,
		tab: 1,
		curplay: -1,
		album: {
			offset: 0,
			loading: false
		},
		mvs: {
			offset: 0,
			loading: false
		},
		desc: {
			loading: false
		},
		simi: {
			loading: false
		}
  },
  onLoad: function(options) {
    let id = options.id
    let that = this
    wx.request({
      url: bsurl + 'artist?id=' + id,
      success: function(res) {
        that.setData({
          art: res.data,
          loading: true
        })
        wx.setNavigationBarTitle({
          title: res.data.artist.name
        })
      }
    })
  },
  playmusic: function(event) {},
  tabtype: function(e) {
    let t = e.currentTarget.dataset.t
    this.setData({
      tab: t
    })
    let that = this
    if (t === 2 && !this.data.album.loading) {
      this.setData({
        loading: false
      })
      wx.request({
        url: bsurl + 'artist/album',
        data: {
          id: that.data.art.artist.id,
          offset: that.data.album.o,
          limit: 20
        },
        success: function(res) {
          res.data.loading = true
          
        }
      })
    }
  }
})