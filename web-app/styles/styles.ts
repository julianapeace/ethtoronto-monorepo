import { SystemStyleObject } from "@chakra-ui/react"
import { Styles } from "@chakra-ui/theme-tools"

const styles: Styles = {
    global: (): SystemStyleObject => ({
        body: {
            // bg: "white",
            // color: "text.700"
        },
        h1: {
          fontFamily: "Montserrat",
          fontSize: "6vmax",
          fontWeight: 600,
          color: "#333",
          gridRow: 2,
          alignSelf: "center",
        },
        p: {
          // fontFamily: "Lora",
          // fontSize: "calc(12pt + 1.4vmax)",
          // fontWeight: 300,
          // textAlign: "center",
          // fontStyle: "italic",
          gridRow: 4,
          alignSelf: "center",
        },
        "body, #app": {
            minHeight: "100vh"
        },
        "#app": {
            display: "flex",
            flexDirection: "column"
        }
    })
}

export default styles
