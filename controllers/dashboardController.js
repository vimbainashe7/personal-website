class DashboardController {
  static async index(req, res) {
    return res.render('landing', {
      layout: false,
      title: 'Vimbai Tandire | Software Engineering Student & Technology Entrepreneur'
    });
  }
}

module.exports = DashboardController;
