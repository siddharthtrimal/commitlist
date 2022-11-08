import React, { useState, useEffect, useCallback } from "react"
import axios from "axios"
import "./App.css"

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "20px",
}

const userInputs = {
  margin: "20px",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "3px",
  cursor: "pointer",
}

const loadStyles = {
  margin: "30px auto",
  border: "6px solid #f3f3f3",
  borderRadius: "50%",
  borderTop: "6px solid #3498db",
  width: "30px",
  height: "30px",
  animation: "spin 2s linear infinite",
}

const refresButtonStyle = {
  marginLeft: "auto",
  fontWeight: 600,
  cursor: "pointer",
  color: "#37CCCA",
}

const titleStyles = {
  padding: "10px 0px",
  margin: "20px 40px",
  textAlign: "start",
}

const commitDetailsSectionStyle = {
  border: "1px solid #ccc",
  borderRadius: "5px",
  padding: "10px 30px",
  margin: "20px 40px",
  textAlign: "start",
}

const refreshingTimerStyle = {
  padding: "20px",
  textAlign: "center",
  top: 0,
  position: "sticky",
  backgroundColor: "#fff",
  boxShadow: "0 2px 3px -1px rgba(0, 0, 0, 0.1)",
}

function App() {
  const [data, setData] = useState(null)
  const [publicKey, setPublicKey] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [repoName, setRepoName] = useState("")
  const [loading, setLoading] = useState(false)
  const [countDownSeconds, setCountDownSeconds] = useState(null)

  useEffect(() => {
    setPublicKey(localStorage.getItem("token") || "")
    setOwnerName(localStorage.getItem("ownerName") || "")
    setRepoName(localStorage.getItem("repoName") || "")
  }, [])

  const refreshCommitsList = useCallback((event) => {
    if (event) {
      event.preventDefault()
    }
    getCommits({
      publicKey: localStorage.getItem("token") || "",
      ownerName: localStorage.getItem("ownerName") || "",
      repoName: localStorage.getItem("repoName") || "",
    })
  }, [])

  useEffect(() => {
    if (countDownSeconds === 0) {
      refreshCommitsList()
      setCountDownSeconds(null)
      return
    }
    if (!countDownSeconds) return

    const countDownInterval = setInterval(() => {
      setCountDownSeconds(countDownSeconds - 1)
    }, 1000)

    return () => clearInterval(countDownInterval)
  }, [countDownSeconds, refreshCommitsList])

  const getCommits = ({ publicKey, ownerName, repoName }) => {
    if (!ownerName || !repoName || !publicKey) {
      return alert("Missing data")
    }
    setLoading(true)
    setCountDownSeconds(null)
    setData([])
    const url = `https://api.github.com/repos/${ownerName}/${repoName}/commits`
    axios
      .get(url, { headers: { Authorization: `Bearer ${publicKey}` } })
      .then((res) => {
        const { data } = res
        const result = []
        if (Array.isArray(data)) {
          data.forEach((ele) => {
            if (!ele || !ele.commit) {
              return
            }
            result.push({
              message: ele.commit.message || "",
              date:
                ele.commit.author.date &&
                new Date(ele.commit.author.date).toLocaleDateString("en-us", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                }),
              author: ele.commit.author.name || "",
              key: new Date(ele.commit.author.date).getTime(),
            })
          })
        }
        setData(result)
        localStorage.setItem("token", publicKey)
        localStorage.setItem("ownerName", ownerName)
        localStorage.setItem("repoName", repoName)
        setCountDownSeconds(30)
      })
      .catch((err) => {
        alert("Failed to get commits")
      })
      .finally(() => setLoading(false))
  }

  const getCommitsFromUserInput = (event) => {
    event.preventDefault()
    getCommits({ publicKey, ownerName, repoName })
  }

  const getTimerDetails = () => {
    if (typeof countDownSeconds !== "number") {
      return null
    }
    return (
      <div style={refreshingTimerStyle}>
        {`Refreshing list in : ${countDownSeconds}s`}
      </div>
    )
  }

  const getCommitList = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null
    }

    return (
      <>
        <div style={refresButtonStyle} onClick={refreshCommitsList}>
          Refresh Commits
        </div>
        <div style={titleStyles}>List of commits : </div>
        {data.map((commitDetails) => (
          <div key={commitDetails.key} style={commitDetailsSectionStyle}>
            <div style={{ fontWeight: 700 }}>{commitDetails.message}</div>
            <div>
              {commitDetails.date}{" "}
              {commitDetails.author ? (
                <span style={{ fontWeight: 700 }}>
                  by {commitDetails.author}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </>
    )
  }

  const getSubmitButton = () => {
    if (loading) {
      return <div style={loadStyles}></div>
    }
    return (
      <button style={userInputs} onClick={getCommitsFromUserInput}>
        Get Commit Details
      </button>
    )
  }

  return (
    <div className="App">
      {getTimerDetails()}
      <div className="userInputs" style={containerStyle}>
        <input
          style={userInputs}
          placeholder="Enter public key"
          value={publicKey}
          onChange={(event) => setPublicKey(event.target.value)}
        />
        <input
          style={userInputs}
          placeholder="Enter owner name"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
        />
        <input
          style={userInputs}
          placeholder="Enter repo name"
          value={repoName}
          onChange={(event) => setRepoName(event.target.value)}
        />
        {getSubmitButton()}
      </div>
      {getCommitList()}
    </div>
  )
}

export default App
