import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import ds from '../styles/design-system'

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: September 23, 2025</Text>

        <Text style={styles.paragraph}>
          Welcome to BeAligned ("the Company", "we" or "us" or "our"). The Company respects and understands your privacy ("you" or "your" or "User"). This Privacy Policy describes how we collect your information through our mobile applications, website, and programs and networks we offer (collectively referred to as the "Services") and how we may use or share that information. This Privacy Policy should be read in conjunction with the Company's "Terms of Use".
        </Text>
        <Text style={styles.paragraph}>
          Access and use of our Services are subject to this Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>1. Personal Information</Text>
        <Text style={styles.paragraph}>
          Personal Information includes other similar terms under applicable privacy laws—such as "personal data" and "personally identifiable information." In general, Personal Information includes any information that identifies, relates to, describes, or is reasonably capable of being associated, linked, or linkable with a particular individual. Types of Personal Information that may be collected include:
        </Text>
        <Text style={styles.bulletPoint}>• First and Last Name</Text>
        <Text style={styles.bulletPoint}>• E-mail Address</Text>
        <Text style={styles.bulletPoint}>• Address for Payment Purposes</Text>
        <Text style={styles.bulletPoint}>• IP Address</Text>
        <Text style={styles.bulletPoint}>• Username</Text>
        <Text style={styles.bulletPoint}>• User Id</Text>
        <Text style={styles.paragraph}>
          In addition to the Personal Information described above, we also collect and retain the reflections and entries that you may input into the Services and publicly available information about you and your businesses, if any.
        </Text>

        <Text style={styles.sectionTitle}>2. How Information Is Collected</Text>
        <Text style={styles.paragraph}>
          When registering on our site or filling out a form, using the Services chat feature, as appropriate, you may be asked to enter your name, address, e-mail address, phone number and interests. You will be contacted in response to any information you request, but you may prevent your contact information from being automatically saved for future contacts by checking the appropriate box.
        </Text>
        <Text style={styles.paragraph}>
          Our Services may use first party and third-party cookies, pixel tags, plugins, and other tools to gather device, usage and browsing information when you use our website, mobile applications or other services. We use the information for security purposes, to facilitate navigation, to personalize and improve your experience.
        </Text>

        <Text style={styles.subSectionTitle}>Cookies</Text>
        <Text style={styles.paragraph}>
          Cookies are small text files that a website or mobile applications transfers to your hard drive to store and sometimes collect information about your usage of websites, such as time spent on the websites, pages visited, language preferences, and other anonymous traffic data. You can control the way in which cookies are used by altering your browser or mobile device settings. You may refuse to accept cookies by activating the setting on your browser or mobile device that allows you to reject cookies. However, if you select such a setting, this may affect the functioning of our Services. Unless you have adjusted your browser setting so that it will refuse cookies, our system will issue cookies when you access or log on to our Services.
        </Text>

        <Text style={styles.subSectionTitle}>Pixel tags and other similar technologies</Text>
        <Text style={styles.paragraph}>
          Pixel tags (also known as web beacons and clear GIFs) may be used in connection with some websites and mobile applications to, among other things, track the actions of users of the websites and mobile applications (including email recipients), measure the success of our marketing campaigns and compile statistics about usage of the websites and mobile applications and response rates.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          Any of the information we collect from you may be used in one of the following ways:
        </Text>
        <Text style={styles.bulletPoint}>• To personalize your experience (your information helps us to better respond to your individual needs)</Text>
        <Text style={styles.bulletPoint}>• To improve our Services and other applications (we continually strive to improve our Services and other offerings based on the information and feedback we receive from you)</Text>
        <Text style={styles.bulletPoint}>• To improve customer service (your information helps us to more effectively respond to your customer service requests and support needs)</Text>
        <Text style={styles.bulletPoint}>• To process transactions: Your information, whether public or private, will not be sold, exchanged, transferred, or given to any other company for any reason whatsoever, without your consent, other than for the express purpose of delivering the product or service requested</Text>
        <Text style={styles.bulletPoint}>• To communicate with you using information you have given us, including contact information you enter on your profile, in responding to your requests or communications of a general marketing nature that you may opt out from receiving at any time</Text>
        <Text style={styles.bulletPoint}>• To perform research and analysis for our business purposes, to produce data sets and reports for internal analytic purposes and improve our service offerings</Text>
        <Text style={styles.bulletPoint}>• To comply with our legal obligations or to prosecute or defend legal proceedings</Text>

        <Text style={styles.paragraph}>
          We may aggregate and anonymize Personal Information that we collect from you and from other sources, in accordance with applicable law, so that the resulting information is no longer reasonably capable of identifying any individual. Such aggregated and anonymized information will no longer be treated as Personal Information and may be used, disclosed, and retained by us for any lawful business purpose, including but not limited to analytics, research, product development, and improving our services. This tool is not intended for sharing mental health information. While we cannot control what you choose to share in the chat, we do not use or retain information for the purpose of creating records of mental health conditions.
        </Text>

        <Text style={styles.paragraph}>
          We will keep your Personal Information only for as long as necessary to fulfill the business-related purposes for which it is collected, unless otherwise necessary to comply with law or is otherwise legally permitted or required. In addition, we may retain certain Personal Information:
        </Text>
        <Text style={styles.bulletPoint}>• To comply with legal and tax data retention obligations, including records of financial transactions</Text>
        <Text style={styles.bulletPoint}>• To stop a former user who was terminated by us from starting a new user account</Text>
        <Text style={styles.bulletPoint}>• For our own legitimate interests, especially in those instances where there may be an outstanding claim, dispute, or issue that may obligate us to keep certain personal information or other data</Text>
        <Text style={styles.bulletPoint}>• To cooperate with law enforcement, a court order, subpoena, or other legal reason</Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We use reasonable measures to protect your Personal Information in order to minimize the risks of theft, damage or loss of information, or the unauthorized access, disclosure or use of information, taking into account the processing and nature of the Personal Information. While we strive to meet prevailing industry data security standards, we cannot guarantee that our services, systems, and platforms will be always immune from malfunctions, unlawful access or breach, or other types of wrongdoing.
        </Text>

        <Text style={styles.sectionTitle}>5. Disclosure of Personal Information</Text>
        <Text style={styles.paragraph}>
          We may disclose Personal Information under the following circumstances:
        </Text>
        <Text style={styles.bulletPoint}>• To third parties in order to help us operate our platform and provide our Services and meet our obligations to you for any Services we are providing to you, including without limitation administrative and technology service providers</Text>
        <Text style={styles.bulletPoint}>• To third parties with whom you choose to let us share information, for example to share content you have created on our platform, including individuals, professionals, merchants and other businesses, and with other applications or websites that integrate with the Services, or those with Services with which we integrate. Note these third parties may themselves have websites and applications with privacy policies beyond our control which differ from this Privacy Policy</Text>
        <Text style={styles.bulletPoint}>• To our affiliates and subsidiaries for the purposes described in this Privacy Policy and to any potential or actual acquirer, successor or assignee as part of any reorganization, merger, sale, joint venture or other transfer or other disposition of all or any portion of our assets, business or equity (before or after the transaction date)</Text>
        <Text style={styles.bulletPoint}>• As required or permitted by applicable law, including to cooperate with law enforcement, a court order, subpoena, or other legal reason, to investigate or prevent wrongdoing in use of our Services, and to protect our rights, property and reputation and those of our other Users</Text>

        <Text style={styles.sectionTitle}>6. Children</Text>
        <Text style={styles.paragraph}>
          Our Service is not intended for anyone under the age of 18.
        </Text>
        <Text style={styles.paragraph}>
          The Services Are Not for or Directed Towards Children. We do not intend to and will not knowingly collect any personal information from children under the age of 18. Children under the age of 18 are prohibited from using the Services. If we learn that we have collected personally identifiable information from a child under the age of 13, we will take reasonable steps to remove that information. If you believe we have collected personal information from a child under the age of 18, please notify us as provided in the "Contact Us" section of this Privacy Policy.
        </Text>

        <Text style={styles.subSectionTitle}>California Minors</Text>
        <Text style={styles.paragraph}>
          If you are a California resident under age 18 and you believe your personally identifiable information has become publicly available through the Service and you are unable to remove it, you may request removal by contacting us as provided in the "Contact Us" section of this Privacy Policy. When requesting removal, you must be specific about the information you want removed and provide us with specific information, so that we can find it.
        </Text>

        <Text style={styles.sectionTitle}>7. Opt-Out Choice</Text>
        <Text style={styles.paragraph}>
          You may opt out from receiving marketing-related communications from us on a going-forward basis by contacting us or by using the unsubscribe directions as contained in each email.
        </Text>
        <Text style={styles.paragraph}>
          Under applicable privacy laws, you may have the right to request to review, make amendments to have deleted or otherwise exercise your rights over your personal information that we hold, subject to certain legal limitations and requirements. If you are subject to such a privacy law, you may submit a request to us related to your personal information by submitting an email request to us as provided in the "Contact Us" section of this Privacy Policy.
        </Text>
        <Text style={styles.paragraph}>
          We will follow applicable law to keep your personal information accurate, complete and up to date. In your request that is covered by an applicable privacy law, please specify the personal information you would like to have changed, whether you would like to have your personal information suppressed from our database or otherwise let us know what limitations you would like to put on our use of your personal information. We may only follow such requests: (a) where required by applicable law; or (b) with respect to the personal information associated with the particular e-mail address that you use to send us your request (please note: we may need to verify your identity before implementing your request). We will comply with your request as soon as possible.
        </Text>
        <Text style={styles.paragraph}>
          Please see Sections 12 and 13 for information about individual rights under California consumer privacy law and the EEA Users.
        </Text>

        <Text style={styles.sectionTitle}>8. Use of Artificial Intelligence</Text>
        <Text style={styles.paragraph}>
          As part of our Services, we utilize artificial intelligence ("AI") solutions to provide functionalities such as recommending alternative phrasing or communication suggestions based on tone and language. Our use of AI is limited to enhancing your experience and delivering features you have explicitly requested.
        </Text>
        <Text style={styles.paragraph}>
          We do not permit partners or third parties to use your personal information for training their own AI models. Any log data or analytics data generated by your use of our Services may be used internally, in accordance with this Privacy Policy, solely to update, modify, or improve our own Services. Where feasible, such data will be anonymized or pseudonymized.
        </Text>
        <Text style={styles.paragraph}>
          Your personal data, including any information you intentionally enter or automatically submit, will be processed by our AI functionalities only to the extent necessary to deliver writing suggestions, insights, or other requested services. We do not use your personal data for profiling, automated decision-making with significant effects, or any purposes beyond these stated uses.
        </Text>
        <Text style={styles.paragraph}>
          You may request access to, correction of, or deletion of personal data processed by our AI features at any time, subject to applicable law. If you wish to object to or restrict AI-driven processing, or wish to request data portability, please contact us using the information in the "Contact Us" section of this Policy. We will respond promptly in accordance with all applicable privacy regulations.
        </Text>
        <Text style={styles.paragraph}>
          We retain personal data related to AI functions only as long as necessary to fulfill the purposes stated above or as required by law. We use recognized security measures to protect all data against unauthorized access, alteration, or disclosure.
        </Text>
        <Text style={styles.paragraph}>
          Where third-party providers are used to deliver AI functionalities (if applicable), we disclose their identity and detail the categories of data shared, subject to your consent.
        </Text>
        <Text style={styles.paragraph}>
          AI systems, while designed to support and improve communications, are inherently probabilistic. Outputs may not always be accurate, complete, or suitable for all circumstances. You are solely responsible for evaluating the accuracy and appropriateness of AI-generated output, using human review as necessary. Do not rely on AI output as your only source of truth or as a substitute for professional advice. You agree not to use any AI feature for making decisions that could involve personal injury, safety, or legal violations.
        </Text>
        <Text style={styles.paragraph}>
          No warranties are made as to the performance or accuracy of AI features, and your use is at your sole risk. This disclaimer is a core part of this Privacy Policy and our Terms and Conditions. Some jurisdictions may not allow limitations on implied warranties; in such cases, portions of this statement may not apply. All rights and remedies provided by state and federal law remain available.
        </Text>
        <Text style={styles.paragraph}>
          The AI communications used by you and the website, application, or services will only be retained by us for 30 days, unless we are required to retain such as described in this Privacy Policy. You may request us to delete any AI communications between you and the website, application, or services by contacting us.
        </Text>

        <Text style={styles.sectionTitle}>9. Third Party Transfers or Services</Text>
        <Text style={styles.paragraph}>
          This Privacy Policy does not apply to third-party services that operate any website, application or services unrelated to our Services but which we may link to our website or applications. Any third-party website, application, or service has their own privacy policy or terms of use that you will be responsible for reading and understanding.
        </Text>

        <Text style={styles.sectionTitle}>10. Amendment of Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We reserve the right, in our sole discretion, to make changes or modifications to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of this Privacy Policy, and you waive any right to receive specific notice of each such change. The most current version of our Privacy Policy will govern our use of information about you. It is your responsibility to periodically review this Privacy Policy to stay informed of updates. You be deemed to have been made aware of and to have accepted the changes in any revised Privacy Policy by your continued use of the Services after the date such revised Privacy Policy is posted.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions or concerns about this Privacy Policy, please contact us in the following ways:
        </Text>
        <Text style={styles.paragraph}>
          Email: support@bealigned.co
        </Text>

        <Text style={styles.sectionTitle}>12. Information for California Residents</Text>
        <Text style={styles.paragraph}>
          Pursuant to the California Consumer Privacy Act of 2018 ("CCPA"), we are providing the following details regarding the categories of Personal Information that we collect, use, and disclose about California residents. Under the CCPA, "Personal Information" is information that identifies, relates to, or could reasonably be linked with a particular California resident or household.
        </Text>

        <Text style={styles.subSectionTitle}>Sources</Text>
        <Text style={styles.paragraph}>
          We collect Personal Information from: Our interactions with you, such as when you use our websites or applications, contact us online or on the phone, sign up for a newsletter, register an account, purchase a product or service, or attend one of our events; and Our affiliates, third-party providers of software applications, made available on the website and applications, and publicly available online sources.
        </Text>

        <Text style={styles.subSectionTitle}>Categories</Text>
        <Text style={styles.paragraph}>
          In the past 12 months, the following categories of Personal Information as listed in the CCPA may have been collected by us:
        </Text>
        <Text style={styles.bulletPoint}>• Category A. Identifiers, such as name, contact information, IP address and other online identifiers</Text>
        <Text style={styles.bulletPoint}>• Category B. Personal information, as defined in the California customer records law, such as name, contact information, payment card number, financial information, employment information, insurance information, and government-issued ID numbers</Text>
        <Text style={styles.bulletPoint}>• Category C. Characteristics of protected classifications under California or federal law, such as marital status</Text>
        <Text style={styles.bulletPoint}>• Category D. Commercial information, such as transaction information and purchase history</Text>
        <Text style={styles.bulletPoint}>• Category F. Internet or network activity information, such as browsing history and interactions with our website</Text>
        <Text style={styles.bulletPoint}>• Category G. Professional or employment-related information</Text>
        <Text style={styles.bulletPoint}>• Category K. Inferences drawn from any of the Personal Information listed above to create a profile about, for example, an individual's preferences and characteristics</Text>

        <Text style={styles.subSectionTitle}>How We Use Personal Information</Text>
        <Text style={styles.paragraph}>
          We use these categories of Personal Information to:
        </Text>
        <Text style={styles.bulletPoint}>• Meet our obligations to you with respect to our services and other products</Text>
        <Text style={styles.bulletPoint}>• Develop, improve, update, and maintain our products and services</Text>
        <Text style={styles.bulletPoint}>• Provide services to our employees and agents</Text>
        <Text style={styles.bulletPoint}>• Personalize, advertise, and market our products and services</Text>
        <Text style={styles.bulletPoint}>• Conduct research, analytics, and data analysis</Text>
        <Text style={styles.bulletPoint}>• Perform general business transactions, record-keeping, and our day-to-day operations</Text>

        <Text style={styles.subSectionTitle}>Disclosure</Text>
        <Text style={styles.paragraph}>
          In the past 12 months, we may have disclosed the following categories of Personal Information as listed in the CCPA to third parties:
        </Text>
        <Text style={styles.bulletPoint}>• Category A. Identifiers, such as name, contact information, IP address and other online identifiers</Text>
        <Text style={styles.bulletPoint}>• Category B. Personal information, as defined in the California customer records law, such as name, contact information, payment card number, financial information, employment information</Text>
        <Text style={styles.bulletPoint}>• Category C. Characteristics of protected classifications under California or federal law, such as marital status</Text>
        <Text style={styles.bulletPoint}>• Category D. Commercial information, such as transaction information and purchase history</Text>
        <Text style={styles.bulletPoint}>• Category F. Internet or network activity information, such as browsing history and interactions with our website</Text>
        <Text style={styles.bulletPoint}>• Category G. Geolocation data, such as device location</Text>
        <Text style={styles.bulletPoint}>• Category I. Professional or employment-related information</Text>
        <Text style={styles.bulletPoint}>• Category K. Inferences drawn from any of the Personal Information listed above to create a profile about, for example, an individual's preferences and characteristics</Text>

        <Text style={styles.paragraph}>
          In the past 12 months we have not sold Personal Information, as a "sale" is defined in the CCPA.
        </Text>

        <Text style={styles.subSectionTitle}>Rights as a California Resident</Text>
        <Text style={styles.paragraph}>
          As a California resident, you may request that we provide to you the following information covering the 12 months preceding your request:
        </Text>
        <Text style={styles.bulletPoint}>• The categories of Personal Information we collected about you and the categories of sources from which we collected such Personal Information</Text>
        <Text style={styles.bulletPoint}>• The specific pieces of Personal Information we collected about you</Text>
        <Text style={styles.bulletPoint}>• The business or commercial purpose for collecting (if applicable) Personal Information about you</Text>
        <Text style={styles.bulletPoint}>• The categories of Personal Information about you that we otherwise shared or disclosed as described above, and the categories of third parties with whom we shared or to whom we disclosed such Personal Information (if applicable)</Text>
        <Text style={styles.bulletPoint}>• Delete Personal Information we collected from you</Text>

        <Text style={styles.paragraph}>
          To make a request for the disclosures or deletion described above, please contact us as provided in the "Contact Us" section of this Privacy Policy.
        </Text>

        <Text style={styles.paragraph}>
          As provided under the CCPA, you have:
        </Text>
        <Text style={styles.bulletPoint}>• the right to know (request disclosure of) personal information collected by us about you, from whom it was collected, why it was collected, and, if sold, to whom</Text>
        <Text style={styles.bulletPoint}>• the right to delete personal information collected from you</Text>
        <Text style={styles.bulletPoint}>• the right to opt-out of the sale of personal information (if applicable)</Text>
        <Text style={styles.bulletPoint}>• the right to non-discriminatory treatment for exercising any rights</Text>
        <Text style={styles.bulletPoint}>• the right to initiate a private cause of action for data breaches. be free from unlawful or discriminatory treatment for utilizing your rights</Text>

        <Text style={styles.paragraph}>
          In the event, that we engage in services that are considered "financial incentives" as defined under the CCPA, we will give notice of the material terms and receive consent from the applicable individuals before they are included in any such incentive.
        </Text>

        <Text style={styles.sectionTitle}>13. EEA Users</Text>
        <Text style={styles.paragraph}>
          If you are located in the European Economic Area (EEA), your personal data is processed in accordance with the General Data Protection Regulation (GDPR).
        </Text>
        <Text style={styles.paragraph}>
          We collect and use your personal data only when we have a valid legal basis, which may include:
        </Text>
        <Text style={styles.bulletPoint}>• Your consent (e.g., for marketing communications)</Text>
        <Text style={styles.bulletPoint}>• Performance of a contract (e.g., to provide you with services)</Text>
        <Text style={styles.bulletPoint}>• Compliance with legal obligations, or</Text>
        <Text style={styles.bulletPoint}>• Our legitimate interests, provided these do not override your fundamental rights</Text>

        <Text style={styles.paragraph}>
          You have the following data protection rights:
        </Text>
        <Text style={styles.bulletPoint}>• Access – Request a copy of the personal data we hold about you</Text>
        <Text style={styles.bulletPoint}>• Rectification – Request that we correct inaccurate or incomplete data</Text>
        <Text style={styles.bulletPoint}>• Erasure – Request deletion of your personal data under certain conditions</Text>
        <Text style={styles.bulletPoint}>• Restriction – Request that we limit the processing of your data</Text>
        <Text style={styles.bulletPoint}>• Objection – Object to our processing based on legitimate interests or direct marketing</Text>
        <Text style={styles.bulletPoint}>• Data Portability – Request transfer of your data to you or another provider</Text>
        <Text style={styles.bulletPoint}>• Withdraw Consent – Where we rely on your consent, you may withdraw it at any time</Text>

        <Text style={styles.paragraph}>
          We may transfer your personal data outside the EEA. When we do, we use safeguards such as standard contractual clauses or other approved mechanisms to ensure adequate protection.
        </Text>
        <Text style={styles.paragraph}>
          To exercise any of your rights, or if you have concerns about how we process your data, please contact us at support@bealigned.co. You also have the right to lodge a complaint with your local Data Protection Authority. You may contact us as provided in the "Contact Us" section of this Privacy Policy at any time if you would like further information.
        </Text>

        <Text style={styles.sectionTitle}>Questions or Updates</Text>
        <Text style={styles.paragraph}>
          If you have questions regarding our Privacy Policy, or if you wish to update the personal information you have provided to us or revoke your consent to our Privacy Policy, you may do so by contacting us as provided in the "Contact Us" section of this Privacy Policy.
        </Text>

        <View style={styles.bottomSpacing} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background.primary,
  },
  content: {
    padding: ds.spacing[6],
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: ds.typography.fontSize['2xl'].size,
    fontWeight: ds.typography.fontWeight.bold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginBottom: ds.spacing[2],
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: ds.typography.fontSize.sm.size,
    color: ds.colors.text.secondary,
    fontFamily: ds.typography.fontFamily.base,
    textAlign: 'center',
    marginBottom: ds.spacing[8],
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: ds.typography.fontSize.lg.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginTop: ds.spacing[6],
    marginBottom: ds.spacing[3],
  },
  subSectionTitle: {
    fontSize: ds.typography.fontSize.base.size,
    fontWeight: ds.typography.fontWeight.semibold,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.heading,
    marginTop: ds.spacing[4],
    marginBottom: ds.spacing[2],
  },
  paragraph: {
    fontSize: ds.typography.fontSize.base.size,
    lineHeight: ds.typography.fontSize.base.lineHeight * 1.5,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[4],
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: ds.typography.fontSize.base.size,
    lineHeight: ds.typography.fontSize.base.lineHeight * 1.5,
    color: ds.colors.text.primary,
    fontFamily: ds.typography.fontFamily.base,
    marginBottom: ds.spacing[2],
    marginLeft: ds.spacing[4],
  },
  bottomSpacing: {
    height: ds.spacing[10],
  },
})