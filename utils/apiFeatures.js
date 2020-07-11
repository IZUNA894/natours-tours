class APIFeatues {
  constructor(query, queryObj) {
    this.query = query;
    this.queryObj = queryObj;
  }

  // filtering data
  filter() {
    // 1a.filtering data
    var queryObj = { ...this.queryObj };
    console.log(queryObj);
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach(element => delete queryObj[element]);

    //1b advanced filtering
    queryObj = JSON.stringify(queryObj);
    queryObj = queryObj.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryObj);
    console.log(queryObj);

    this.query = this.query.find(queryObj);
    return this;
  }

  // 2 sorting data
  sort() {
    if (this.queryObj.sort) {
      let sortQuery = this.queryObj.sort;
      sortQuery = sortQuery.replace(",", " ");
      this.query = this.query.sort(sortQuery);
    } else {
      const sortQuery = "-createdAt";
      this.query = this.query.sort(sortQuery);
    }
    return this;
  }

  // 3 selecting fields
  selectingFields() {
    // **********note*************
    // if use - infront of key,then it wiill be excluded from result
    if (this.queryObj.fields) {
      let fieldsQuery = this.queryObj.fields;
      fieldsQuery = fieldsQuery.replace(",", " ");
      this.query = this.query.select(fieldsQuery);
    } else {
      const fieldsQuery = "-_v";
      this.query = this.query.select(fieldsQuery);
    }
    return this;
  }

  //   pagination
  pagination() {
    const page = this.queryObj.page * 1 || 1;
    const limit = this.queryObj.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryObj.page) {
    //   var numOfDoc = await Tour.countDocuments();
    //   if (skip >= numOfDoc) throw new Error("dont have enough results");
    // }
    return this;
  }
}

module.exports = APIFeatues;
